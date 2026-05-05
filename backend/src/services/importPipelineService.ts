import { supabase } from '../config/supabase.js';
import { CommitImportSessionInput, ImportSessionInput } from '../validators/schemas.js';
import { createTransactionCandidate } from './transactionInboxService.js';

const asRows = (value: unknown): any[] => Array.isArray(value) ? value : [];
const normalizeDate = (value?: string | null) => {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const fileTypeFromName = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'csv') return 'csv';
    if (ext === 'xlsx' || ext === 'xls') return 'excel';
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) return 'image';
    if (ext === 'docx') return 'docx';
    return 'unknown';
};

export async function createImportSession(userId: string, input: ImportSessionInput) {
    const fileName = input.fileName || input.file_name || 'import';
    const fileType = input.fileType || input.file_type || fileTypeFromName(fileName);
    const rows = input.rows || [];
    const validRows = rows.filter((row) => row.description && Number(row.amount) > 0).length;
    const errorRows = rows.length - validRows;
    const duplicateRows = rows.filter((row) => row.duplicateWarning || row.duplicate_warning).length;

    const { data: session, error } = await supabase
        .from('import_sessions')
        .insert({
            user_id: userId,
            file_name: fileName,
            file_type: fileType,
            status: 'review',
            total_rows: rows.length,
            valid_rows: validRows,
            duplicate_rows: duplicateRows,
            error_rows: errorRows,
        })
        .select()
        .single();

    if (error) throw error;

    if (rows.length > 0) {
        const rowPayload = rows.map((row, index) => {
            const validationErrors = row.validationErrors || row.validation_errors || [];
            const amount = Number(row.amount);
            return {
                session_id: session.id,
                user_id: userId,
                row_index: index,
                description: row.description || null,
                amount: Number.isFinite(amount) ? Math.abs(amount) : null,
                date: row.date ? normalizeDate(row.date) : null,
                type: row.type || 'expense',
                category: row.category || 'Other',
                merchant_name: row.merchantName || row.merchant_name || row.description || null,
                confidence: row.confidence ?? 0.7,
                duplicate_warning: row.duplicateWarning || row.duplicate_warning || false,
                validation_errors: validationErrors,
                selected: row.selected ?? validationErrors.length === 0,
                status: validationErrors.length ? 'error' : 'review',
                raw_payload: row.rawPayload || row.raw_payload || row,
            };
        });

        const { error: rowsError } = await supabase.from('import_rows').insert(rowPayload);
        if (rowsError) throw rowsError;
    }

    return getImportSession(userId, session.id);
}

export async function getImportSession(userId: string, id: string) {
    const [sessionResult, rowsResult] = await Promise.all([
        supabase.from('import_sessions').select('*').eq('id', id).eq('user_id', userId).maybeSingle(),
        supabase.from('import_rows').select('*').eq('session_id', id).eq('user_id', userId).order('row_index', { ascending: true }),
    ]);

    if (sessionResult.error) throw sessionResult.error;
    if (rowsResult.error) throw rowsResult.error;

    return {
        session: sessionResult.data,
        rows: asRows(rowsResult.data),
    };
}

export async function listImportSessions(userId: string) {
    const { data, error } = await supabase
        .from('import_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;
    return asRows(data);
}

export async function commitImportSession(userId: string, id: string, input: CommitImportSessionInput = {}) {
    let query = supabase
        .from('import_rows')
        .select('*')
        .eq('session_id', id)
        .eq('user_id', userId)
        .eq('selected', true)
        .eq('status', 'review');

    if (input.rowIds?.length) {
        query = query.in('id', input.rowIds);
    }

    const { data, error } = await query.order('row_index', { ascending: true });
    if (error) throw error;

    const results = [];
    for (const row of asRows(data)) {
        try {
            if (!row.description || !row.amount) {
                results.push({ rowId: row.id, success: false, error: 'Missing description or amount' });
                continue;
            }

            const created = await createTransactionCandidate(userId, {
                source: row.raw_payload?.source || (row.raw_payload?.fileType === 'excel' ? 'excel' : 'csv'),
                description: row.description,
                amount: Number(row.amount),
                date: row.date,
                type: row.type || 'expense',
                category: row.category || 'Other',
                merchantName: row.merchant_name || row.description,
                rawPayload: row.raw_payload || row,
                confidence: row.confidence ?? 0.7,
                importSessionId: id,
            });

            await supabase
                .from('import_rows')
                .update({ status: 'candidate_created', candidate_id: created.candidate.id })
                .eq('id', row.id)
                .eq('user_id', userId);

            results.push({ rowId: row.id, success: true, candidate: created.candidate, duplicate: created.duplicate });
        } catch (error) {
            results.push({ rowId: row.id, success: false, error: error instanceof Error ? error.message : String(error) });
        }
    }

    await supabase
        .from('import_sessions')
        .update({ status: 'committed', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);

    return results;
}
