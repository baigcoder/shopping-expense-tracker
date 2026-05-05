import { supabase } from '../config/supabase.js';

const DEFAULT_STEPS = [
    { id: 'currency', label: 'Choose currency', path: '/settings' },
    { id: 'import', label: 'Import CSV/PDF or add a transaction', path: '/transactions' },
    { id: 'inbox', label: 'Review inbox candidates', path: '/transaction-inbox' },
    { id: 'budget', label: 'Create a budget or goal', path: '/budgets' },
    { id: 'extension', label: 'Connect extension', path: '/extension-health' },
    { id: 'coach', label: 'Generate weekly AI coach plan', path: '/insights' },
];

const toStatus = (row: any = {}) => {
    const completedStepIds = Array.isArray(row.completed_step_ids) ? row.completed_step_ids : [];
    const steps = DEFAULT_STEPS.map((step) => ({
        ...step,
        completed: completedStepIds.includes(step.id),
    }));

    return {
        completedStepIds,
        dismissedExtensionPrompt: !!row.dismissed_extension_prompt,
        completed: steps.every((step) => step.completed),
        progress: steps.length ? Math.round((steps.filter((step) => step.completed).length / steps.length) * 100) : 0,
        steps,
        updatedAt: row.updated_at || null,
    };
};

export async function getOnboardingStatus(userId: string) {
    const { data, error } = await supabase
        .from('onboarding_status')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    if (data) return toStatus(data);

    const { data: created, error: createError } = await supabase
        .from('onboarding_status')
        .upsert({
            user_id: userId,
            completed_step_ids: [],
            dismissed_extension_prompt: false,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

    if (createError) throw createError;
    return toStatus(created);
}

export async function updateOnboardingStatus(userId: string, input: Record<string, any>) {
    const current = await getOnboardingStatus(userId);
    const incomingCompleted = input.completedStepIds || input.completed_step_ids;
    const markCompleted = input.markCompleted || input.mark_completed;
    const markIncomplete = input.markIncomplete || input.mark_incomplete;

    const completed = new Set<string>(
        Array.isArray(incomingCompleted) ? incomingCompleted : current.completedStepIds
    );

    if (markCompleted) completed.add(String(markCompleted));
    if (markIncomplete) completed.delete(String(markIncomplete));

    const validStepIds = new Set(DEFAULT_STEPS.map((step) => step.id));
    const completedStepIds = [...completed].filter((stepId) => validStepIds.has(stepId));

    const { data, error } = await supabase
        .from('onboarding_status')
        .upsert({
            user_id: userId,
            completed_step_ids: completedStepIds,
            dismissed_extension_prompt: input.dismissedExtensionPrompt ?? input.dismissed_extension_prompt ?? current.dismissedExtensionPrompt,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) throw error;
    return toStatus(data);
}
