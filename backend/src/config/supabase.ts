// Firebase-backed compatibility layer for server code that previously used Supabase.
import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || 'tracker-3960c';
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'tracker-3960c.firebasestorage.app';

if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    admin.initializeApp({
        ...(serviceAccountJson ? { credential: admin.credential.cert(JSON.parse(serviceAccountJson)) } : {}),
        projectId,
        storageBucket,
    });
}

const tables = new Map<string, Map<string, any>>();

const getTable = (table: string) => {
    let records = tables.get(table);
    if (!records) {
        records = new Map<string, any>();
        tables.set(table, records);
    }

    return records;
};

type Filter = {
    field: string;
    op: 'eq' | 'neq' | 'gte' | 'lte' | 'lt' | 'gt' | 'in' | 'is' | 'ilike';
    value: any;
};

const cleanRecord = (value: any): any => {
    if (Array.isArray(value)) return value.map(cleanRecord);
    if (!value || typeof value !== 'object') return value;

    return Object.fromEntries(
        Object.entries(value)
            .filter(([, entry]) => entry !== undefined)
            .map(([key, entry]) => [key, cleanRecord(entry)])
    );
};

class FirebaseQueryBuilder implements PromiseLike<{ data: any; error: any; count?: number | null }> {
    private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
    private filters: Filter[] = [];
    private payload: any;
    private columns = '*';
    private singleResult = false;
    private maybeSingleResult = false;
    private orderByField?: string;
    private ascending = true;
    private limitCount?: number;
    private rangeFrom?: number;
    private rangeTo?: number;
    private head = false;
    private countMode?: string;

    constructor(private readonly table: string) { }

    select(columns = '*', options?: { count?: string; head?: boolean }) {
        this.action = this.action === 'select' ? 'select' : this.action;
        this.columns = columns;
        this.head = !!options?.head;
        this.countMode = options?.count;
        return this;
    }

    insert(payload: any) { this.action = 'insert'; this.payload = payload; return this; }
    update(payload: any) { this.action = 'update'; this.payload = payload; return this; }
    delete() { this.action = 'delete'; return this; }
    upsert(payload: any, _options?: any) { this.action = 'upsert'; this.payload = payload; return this; }

    eq(field: string, value: any) { this.filters.push({ field, op: 'eq', value }); return this; }
    neq(field: string, value: any) { this.filters.push({ field, op: 'neq', value }); return this; }
    gte(field: string, value: any) { this.filters.push({ field, op: 'gte', value }); return this; }
    lte(field: string, value: any) { this.filters.push({ field, op: 'lte', value }); return this; }
    lt(field: string, value: any) { this.filters.push({ field, op: 'lt', value }); return this; }
    gt(field: string, value: any) { this.filters.push({ field, op: 'gt', value }); return this; }
    in(field: string, value: any[]) { this.filters.push({ field, op: 'in', value }); return this; }
    is(field: string, value: any) { this.filters.push({ field, op: 'is', value }); return this; }
    ilike(field: string, value: string) { this.filters.push({ field, op: 'ilike', value }); return this; }
    not(field: string, _operator: string, value: any) { this.filters.push({ field, op: 'neq', value }); return this; }
    or(_expression: string) { return this; }

    order(field: string, options?: { ascending?: boolean }) {
        this.orderByField = field;
        this.ascending = options?.ascending !== false;
        return this;
    }

    limit(count: number) { this.limitCount = count; return this; }
    range(from: number, to: number) { this.rangeFrom = from; this.rangeTo = to; return this; }
    single() { this.singleResult = true; return this; }
    maybeSingle() { this.maybeSingleResult = true; return this; }

    then<TResult1 = { data: any; error: any; count?: number | null }, TResult2 = never>(
        onfulfilled?: ((value: { data: any; error: any; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2> {
        return this.execute().then(onfulfilled, onrejected);
    }

    private async execute() {
        try {
            if (this.action === 'insert') return this.insertRows();
            if (this.action === 'upsert') return this.upsertRows();
            if (this.action === 'update') return this.updateRows();
            if (this.action === 'delete') return this.deleteRows();

            return this.formatRows(await this.getMatchingRows());
        } catch (error) {
            return { data: this.singleResult || this.maybeSingleResult ? null : [], error };
        }
    }

    private async insertRows() {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const saved = [];
        const table = getTable(this.table);

        for (const row of rows) {
            const id = row.id || crypto.randomUUID();
            const now = new Date().toISOString();
            const record = cleanRecord({ id, created_at: row.created_at || now, ...row });
            table.set(id, record);
            saved.push(record);
        }

        return this.formatRows(saved);
    }

    private async upsertRows() {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const saved = [];
        const table = getTable(this.table);

        for (const row of rows) {
            const id = row.id || [row.user_id, row.hostname, row.merchant_name, row.store_name, row.name].filter(Boolean).join('_') || row.user_id || crypto.randomUUID();
            const record = cleanRecord({ id, updated_at: new Date().toISOString(), ...row });
            const merged = cleanRecord({ ...(table.get(id) || {}), ...record });
            table.set(id, merged);
            saved.push(merged);
        }

        return this.formatRows(saved);
    }

    private async updateRows() {
        const rows = await this.getMatchingRows();
        const patch = cleanRecord({ ...this.payload, updated_at: new Date().toISOString() });
        const updated = [];
        const table = getTable(this.table);

        for (const row of rows) {
            const record = cleanRecord({ ...row, ...patch });
            table.set(row.id, record);
            updated.push(record);
        }

        return this.formatRows(updated);
    }

    private async deleteRows() {
        const rows = await this.getMatchingRows();
        const table = getTable(this.table);
        for (const row of rows) {
            table.delete(row.id);
        }

        return { data: this.columns === '*' ? rows : null, error: null, count: rows.length };
    }

    private async getMatchingRows() {
        let rows: any[] = Array.from(getTable(this.table).values());
        rows = rows.filter((row) => this.filters.every((filter) => this.matchesFilter(row, filter)));

        if (this.orderByField) {
            rows.sort((a, b) => {
                const left = a[this.orderByField!];
                const right = b[this.orderByField!];
                if (left === right) return 0;
                const result = left > right ? 1 : -1;
                return this.ascending ? result : -result;
            });
        }

        if (this.rangeFrom !== undefined && this.rangeTo !== undefined) rows = rows.slice(this.rangeFrom, this.rangeTo + 1);
        if (this.limitCount !== undefined) rows = rows.slice(0, this.limitCount);
        return rows;
    }

    private matchesFilter(row: any, filter: Filter) {
        const value = row[filter.field];
        switch (filter.op) {
            case 'eq': return value === filter.value;
            case 'neq': return value !== filter.value;
            case 'gte': return value >= filter.value;
            case 'lte': return value <= filter.value;
            case 'lt': return value < filter.value;
            case 'gt': return value > filter.value;
            case 'in': return filter.value.includes(value);
            case 'is': return value === filter.value;
            case 'ilike': {
                const pattern = String(filter.value).replace(/^%|%$/g, '').toLowerCase();
                return String(value || '').toLowerCase().includes(pattern);
            }
            default: return true;
        }
    }

    private formatRows(rows: any[]) {
        const projected = rows.map((row) => this.project(row));
        const count = this.countMode ? projected.length : null;

        if (this.head) return { data: null, error: null, count };
        if (this.singleResult || this.maybeSingleResult) {
            const error = this.singleResult && !projected[0]
                ? Object.assign(new Error('No rows found'), { code: 'PGRST116' })
                : null;

            return { data: projected[0] || null, error, count };
        }

        return { data: projected, error: null, count };
    }

    private project(row: any) {
        if (!this.columns || this.columns === '*') return row;
        const fields = this.columns.split(',').map((field) => field.trim()).filter(Boolean);
        return Object.fromEntries(fields.map((field) => [field, row[field]]));
    }
}

const supabaseClient = {
    from: (table: string) => new FirebaseQueryBuilder(table),
    auth: {
        admin: {
            listUsers: async () => {
                const users = await admin.auth().listUsers();
                return { data: { users: users.users.map((user) => ({ ...user, id: user.uid })) }, error: null };
            },
            createUser: async (data: any) => {
                const user = await admin.auth().createUser({
                    email: data.email,
                    password: data.password,
                    displayName: data.user_metadata?.name || data.user_metadata?.full_name,
                    emailVerified: data.email_confirm ?? true,
                });
                return { data: { user: { ...user, id: user.uid } }, error: null };
            },
        },
    },
};

export const supabase: any = supabaseClient;
export const supabaseAdmin = supabase;

export const verifyToken = async (token: string) => {
    const decoded = await admin.auth().verifyIdToken(token);

    return {
        id: decoded.uid,
        email: decoded.email,
        user_metadata: {
            name: decoded.name,
            avatar_url: decoded.picture,
        },
    };
};
