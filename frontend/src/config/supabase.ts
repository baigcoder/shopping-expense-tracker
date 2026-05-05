// Firebase-backed compatibility layer for the old Supabase client imports.
// This keeps the app moving while data/auth are migrated away from Supabase.
import { initializeApp } from 'firebase/app';
import {
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    onIdTokenChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut as firebaseSignOut,
    updateProfile,
    type User as FirebaseUser,
} from 'firebase/auth';
import {
    deleteObject,
    getDownloadURL,
    getStorage,
    ref,
    uploadBytes,
} from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAbveJm46vlt1CKqEdYQE-c21QbZBrNpEY',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tracker-3960c.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tracker-3960c',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tracker-3960c.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '212101348862',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:212101348862:web:dd9742ccc5d1f2baf314af',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-CXVV4Q3JYB',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);

let initialAuthResolved = false;
let initialAuthPromise: Promise<FirebaseUser | null> | null = null;

const waitForInitialAuth = async (): Promise<FirebaseUser | null> => {
    if (initialAuthResolved) return firebaseAuth.currentUser;

    if (!initialAuthPromise) {
        initialAuthPromise = new Promise((resolve) => {
            let unsubscribe: () => void = () => undefined;
            unsubscribe = onAuthStateChanged(
                firebaseAuth,
                (user) => {
                    initialAuthResolved = true;
                    unsubscribe();
                    resolve(user);
                },
                () => {
                    initialAuthResolved = true;
                    unsubscribe();
                    resolve(null);
                }
            );
        });
    }

    return initialAuthPromise;
};

if (
    typeof window !== 'undefined' &&
    import.meta.env.PROD &&
    import.meta.env.VITE_ENABLE_FIREBASE_ANALYTICS === 'true'
) {
    import('firebase/analytics')
        .then(({ getAnalytics, isSupported }) => isSupported().then((supported) => supported && getAnalytics(firebaseApp)))
        .catch(() => undefined);
}

const toSupabaseUser = async (user: FirebaseUser | null): Promise<any> => {
    if (!user) return null;

    return {
        id: user.uid,
        email: user.email,
        created_at: user.metadata.creationTime || new Date().toISOString(),
        user_metadata: {
            name: user.displayName,
            full_name: user.displayName,
            avatar_url: user.photoURL,
        },
    };
};

const toSession = async (user: FirebaseUser | null): Promise<any> => {
    if (!user) return null;

    return {
        access_token: await user.getIdToken(),
        refresh_token: user.refreshToken,
        user: await toSupabaseUser(user),
    };
};

/** Same-origin localStorage mirror for the browser extension (Firebase often uses IndexedDB only). */
const CASHLY_WEB_SESSION_BRIDGE_KEY = 'cashly_web_session_bridge';

if (typeof window !== 'undefined') {
    onIdTokenChanged(firebaseAuth, async (user) => {
        try {
            const session = await toSession(user);
            if (session?.access_token && session?.user) {
                localStorage.setItem(
                    CASHLY_WEB_SESSION_BRIDGE_KEY,
                    JSON.stringify({
                        access_token: session.access_token,
                        user: session.user,
                    }),
                );
                window.postMessage({
                    type: 'WEBSITE_TO_EXTENSION',
                    action: 'SYNC_SESSION',
                    data: {
                        session,
                        user: session.user,
                        accessToken: session.access_token,
                    },
                }, '*');
                window.postMessage({
                    type: 'WEBSITE_TO_EXTENSION',
                    action: 'CHECK_STATUS',
                }, '*');
            } else {
                localStorage.removeItem(CASHLY_WEB_SESSION_BRIDGE_KEY);
                window.postMessage({
                    type: 'WEBSITE_TO_EXTENSION',
                    action: 'LOGOUT',
                }, '*');
            }
        } catch {
            localStorage.removeItem(CASHLY_WEB_SESSION_BRIDGE_KEY);
            window.postMessage({
                type: 'WEBSITE_TO_EXTENSION',
                action: 'LOGOUT',
            }, '*');
        }
    });
}

const cleanRecord = (value: any): any => {
    if (Array.isArray(value)) return value.map(cleanRecord);
    if (!value || typeof value !== 'object') return value;

    return Object.fromEntries(
        Object.entries(value)
            .filter(([, entry]) => entry !== undefined)
            .map(([key, entry]) => [key, cleanRecord(entry)])
    );
};

const tableStorageKey = (table: string) => `cashly_table_${table}`;

const readTableRows = (table: string): any[] => {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(tableStorageKey(table));
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeTableRows = (table: string, rows: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(tableStorageKey(table), JSON.stringify(rows));
};

type Filter = {
    field: string;
    op: 'eq' | 'neq' | 'gte' | 'lte' | 'lt' | 'gt' | 'in' | 'is';
    value: any;
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

    insert(payload: any) {
        this.action = 'insert';
        this.payload = payload;
        return this;
    }

    update(payload: any) {
        this.action = 'update';
        this.payload = payload;
        return this;
    }

    delete() {
        this.action = 'delete';
        return this;
    }

    upsert(payload: any, _options?: any) {
        this.action = 'upsert';
        this.payload = payload;
        return this;
    }

    eq(field: string, value: any) { this.filters.push({ field, op: 'eq', value }); return this; }
    neq(field: string, value: any) { this.filters.push({ field, op: 'neq', value }); return this; }
    gte(field: string, value: any) { this.filters.push({ field, op: 'gte', value }); return this; }
    lte(field: string, value: any) { this.filters.push({ field, op: 'lte', value }); return this; }
    lt(field: string, value: any) { this.filters.push({ field, op: 'lt', value }); return this; }
    gt(field: string, value: any) { this.filters.push({ field, op: 'gt', value }); return this; }
    in(field: string, value: any[]) { this.filters.push({ field, op: 'in', value }); return this; }
    is(field: string, value: any) { this.filters.push({ field, op: 'is', value }); return this; }
    not(field: string, _operator: string, value: any) { this.filters.push({ field, op: 'neq', value }); return this; }
    or(_expression: string) { return this; }

    order(field: string, options?: { ascending?: boolean }) {
        this.orderByField = field;
        this.ascending = options?.ascending !== false;
        return this;
    }

    limit(count: number) {
        this.limitCount = count;
        return this;
    }

    range(from: number, to: number) {
        this.rangeFrom = from;
        this.rangeTo = to;
        return this;
    }

    single() {
        this.singleResult = true;
        return this;
    }

    maybeSingle() {
        this.maybeSingleResult = true;
        return this;
    }

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

            const rows = await this.getMatchingRows();
            return this.formatRows(rows);
        } catch (error) {
            return { data: this.singleResult || this.maybeSingleResult ? null : [], error };
        }
    }

    private async insertRows() {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const existingRows = readTableRows(this.table);
        const saved: any[] = [];

        for (const row of rows) {
            const id = row.id || crypto.randomUUID();
            const now = new Date().toISOString();
            const record = cleanRecord({ id, created_at: row.created_at || now, ...row });
            existingRows.push(record);
            saved.push(record);
        }

        writeTableRows(this.table, existingRows);
        return this.formatRows(saved);
    }

    private async upsertRows() {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const existingRows = readTableRows(this.table);
        const saved: any[] = [];

        for (const row of rows) {
            const id = row.id || row.user_id || [row.user_id, row.merchant_name, row.store_name, row.name].filter(Boolean).join('_') || crypto.randomUUID();
            const now = new Date().toISOString();
            const record = cleanRecord({ id, updated_at: now, ...row });
            const existingIndex = existingRows.findIndex((item) => item.id === id);

            if (existingIndex >= 0) {
                existingRows[existingIndex] = cleanRecord({ ...existingRows[existingIndex], ...record });
            } else {
                existingRows.push(record);
            }

            saved.push(record);
        }

        writeTableRows(this.table, existingRows);
        return this.formatRows(saved);
    }

    private async updateRows() {
        const allRows = readTableRows(this.table);
        const rows = this.applyQuery(allRows);
        const updated: any[] = [];
        const patch = cleanRecord({ ...this.payload, updated_at: new Date().toISOString() });
        const matchingIds = new Set(rows.map((row) => row.id));

        const nextRows = allRows.map((row) => {
            if (!matchingIds.has(row.id)) return row;
            const nextRow = cleanRecord({ ...row, ...patch });
            updated.push(nextRow);
            return nextRow;
        });

        writeTableRows(this.table, nextRows);
        return this.formatRows(updated);
    }

    private async deleteRows() {
        const allRows = readTableRows(this.table);
        const rows = this.applyQuery(allRows);
        const deletedIds = new Set(rows.map((row) => row.id));
        writeTableRows(this.table, allRows.filter((row) => !deletedIds.has(row.id)));

        return { data: this.columns === '*' ? rows : null, error: null, count: rows.length };
    }

    private async getMatchingRows() {
        return this.applyQuery(readTableRows(this.table));
    }

    private applyQuery(inputRows: any[]) {
        let rows = [...inputRows];
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

        if (this.rangeFrom !== undefined && this.rangeTo !== undefined) {
            rows = rows.slice(this.rangeFrom, this.rangeTo + 1);
        }

        if (this.limitCount !== undefined) {
            rows = rows.slice(0, this.limitCount);
        }

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
            default: return true;
        }
    }

    private formatRows(rows: any[]) {
        const projected = rows.map((row) => this.project(row));
        const count = this.countMode ? projected.length : null;

        if (this.head) {
            return { data: null, error: null, count };
        }

        if (this.singleResult || this.maybeSingleResult) {
            return { data: projected[0] || null, error: this.singleResult && !projected[0] ? new Error('No rows found') : null, count };
        }

        return { data: projected, error: null, count };
    }

    private project(row: any) {
        if (!this.columns || this.columns === '*') return row;

        const fields = this.columns
            .split(',')
            .map((field) => field.trim())
            .filter(Boolean);

        return Object.fromEntries(fields.map((field) => [field, row[field]]));
    }
}

const auth = {
    async signUp({ email, password, options }: any) {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (options?.data?.name || options?.data?.full_name) {
            await updateProfile(credential.user, {
                displayName: options.data.full_name || options.data.name,
            });
        }
        return { data: { user: await toSupabaseUser(credential.user), session: await toSession(credential.user) }, error: null };
    },

    async signInWithPassword({ email, password }: any) {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        return { data: { user: await toSupabaseUser(credential.user), session: await toSession(credential.user) }, error: null };
    },

    async signInWithOAuth({ provider }: any) {
        if (provider !== 'google') throw new Error(`Unsupported provider: ${provider}`);
        try {
            const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
            return { data: { user: await toSupabaseUser(credential.user), session: await toSession(credential.user) }, error: null };
        } catch (err: any) {
            // Map Firebase auth errors to user-friendly messages
            const code = err?.code || '';
            if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                return { data: null, error: { message: 'Sign-in was cancelled', code } };
            }
            if (code === 'auth/unauthorized-domain') {
                return { data: null, error: { message: 'This domain is not authorized for Google sign-in. Add it in Firebase Console > Authentication > Settings.', code } };
            }
            if (code === 'auth/popup-blocked') {
                return { data: null, error: { message: 'Popup was blocked by the browser. Please allow popups and try again.', code } };
            }
            if (code === 'auth/network-request-failed') {
                return { data: null, error: { message: 'Network error. Please check your connection and try again.', code } };
            }
            // Re-throw unknown errors
            throw err;
        }
    },

    async signOut() {
        await firebaseSignOut(firebaseAuth);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(CASHLY_WEB_SESSION_BRIDGE_KEY);
            window.postMessage({
                type: 'WEBSITE_TO_EXTENSION',
                action: 'LOGOUT',
            }, '*');
        }
        return { error: null };
    },

    async updateUser({ data }: any) {
        const user = await waitForInitialAuth();
        if (!user) return { data: null, error: new Error('No authenticated user') };
        await updateProfile(user, {
            displayName: data?.full_name || data?.name || user.displayName,
            photoURL: data?.avatar_url || user.photoURL,
        });
        return { data: { user: await toSupabaseUser(firebaseAuth.currentUser) }, error: null };
    },

    async getUser() {
        return { data: { user: await toSupabaseUser(await waitForInitialAuth()) }, error: null };
    },

    async getSession() {
        return { data: { session: await toSession(await waitForInitialAuth()) }, error: null };
    },

    async setSession(_session?: any) {
        return { data: { session: await toSession(await waitForInitialAuth()) }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
            callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', await toSession(user));
        });

        return { data: { subscription: { unsubscribe } } };
    },
};

const supabaseClient = {
    auth,
    from: (table: string) => new FirebaseQueryBuilder(table),
    channel: ((_name: string, _options?: any): any => ({
        on: (_event: string, _filter: any, _callback?: (payload: any) => void) => supabaseClient.channel(_name),
        send: async (_payload: any) => 'ok',
        subscribe: (callback?: (status: string, error?: any) => void) => {
            callback?.('SUBSCRIBED');
            return supabaseClient.channel(_name);
        },
        unsubscribe: () => undefined,
    })),
    removeChannel: (_channel?: any) => undefined,
    storage: {
        from: (bucket: string) => ({
            upload: async (path: string, file: Blob | File, _options?: any) => {
                await uploadBytes(ref(firebaseStorage, `${bucket}/${path}`), file);
                return { data: { path }, error: null };
            },
            getPublicUrl: (path: string) => ({
                data: {
                    publicUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(`${bucket}/${path}`)}?alt=media`,
                },
            }),
            remove: async (paths: string[]) => {
                await Promise.all(paths.map((path) => deleteObject(ref(firebaseStorage, `${bucket}/${path}`))));
                return { data: null, error: null };
            },
            downloadUrl: async (path: string) => getDownloadURL(ref(firebaseStorage, `${bucket}/${path}`)),
        }),
    },
};

export const supabase: any = supabaseClient;

export const signUpWithEmail = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name || '', full_name: name || '' } },
    });
    if (error) throw error;
    return data;
};

export const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
};

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
    return data;
};

export const logout = async () => {
    sessionStorage.setItem('explicit_logout', 'true');
    await supabase.auth.signOut();

    if (typeof window !== 'undefined') {
        localStorage.removeItem(CASHLY_WEB_SESSION_BRIDGE_KEY);
        window.postMessage({
            type: 'WEBSITE_TO_EXTENSION',
            action: 'LOGOUT',
        }, '*');
    }

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('firebase:') || key.includes('supabase') || key.includes('auth') || key.startsWith('sb-'))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
};

export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
};

export const getSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
};
