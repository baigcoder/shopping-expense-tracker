// Ask Cashly: live AI chat, weekly plan and insights around the shared AssistView (the demo renders the same view).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AssistView, type ChatMessage, type Insight, type PlanAction } from '../features/assist/AssistView';
import { linkFor } from '../features/assist/linkFor';
import { useAuthStore } from '../store/useStore';
import { generateSmartInsights } from '../services/smartInsightsService';
import { getAIResponse, getBackendInsights } from '../services/aiService';
import { featureExpansionApi } from '../services/featureExpansionApi';
import VoiceCallModal from '../components/VoiceCallModal';
import { loadHomeInput } from '../features/home/loadHomeInput';
import { buildHomeModel, type HomeInput } from '../features/home/homeModel';
import { homeFacts } from '../features/assist/homeFacts';
import { formatCurrency } from '../services/currencyService';
import { FINANCIAL_DATA_EVENTS } from '../services/financialDataEvents';

const SUGGESTIONS = ['Can I afford a Rs 30,000 phone?', 'Where did my money go this month?', 'Which subscriptions should I cancel?'];

export const InsightsPage = () => {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sending, setSending] = useState(false);
    const [plan, setPlan] = useState<PlanAction[] | null>(null);
    const [planning, setPlanning] = useState(false);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [voice, setVoice] = useState(false);
    const [home, setHome] = useState<Omit<HomeInput, 'now'> | null>(null);
    // The same figures Home shows, sent with every question.
    const facts = useMemo(() => (home ? homeFacts(buildHomeModel(home), (n) => formatCurrency(n)) : undefined), [home]);

    const load = useCallback(async () => {
        if (!user?.id) return;
        void loadHomeInput(user.id, false).then((h) => h && setHome(h)).catch(() => undefined);
        try {
            const local = await generateSmartInsights(user.id);
            setInsights(local.insights.map((i) => ({ id: i.id, title: i.title, message: i.message, path: i.actionPath, urgent: i.severity === 'high' })));
        } catch { /* insights are optional on this screen */ }
        void getBackendInsights(user.id).then((b) => {
            const remote = (b.insights || []).filter((i: { message?: string }) => i.message).map((i: { type?: string; title?: string; message?: string }, n: number) => ({
                id: `ai-${n}`, title: i.title || 'From Cashly AI', message: i.message || '', urgent: i.type === 'risk' || i.type === 'warning',
            }));
            if (remote.length) setInsights((cur) => [...remote, ...cur.filter((c) => !remote.some((r: Insight) => r.title === c.title))].slice(0, 8));
        }).catch(() => undefined);
        try { setPlan((await featureExpansionApi.currentCoach())?.actions ?? null); } catch { /* no plan yet */ }
    }, [user?.id]);

    useEffect(() => { void load(); }, [load]);
    // Approvals and edits elsewhere update the figures the next answer uses.
    useEffect(() => {
        if (!user?.id) return;
        const refresh = () => void loadHomeInput(user.id, true).then((h) => h && setHome(h)).catch(() => undefined);
        FINANCIAL_DATA_EVENTS.forEach((e) => window.addEventListener(e, refresh));
        return () => FINANCIAL_DATA_EVENTS.forEach((e) => window.removeEventListener(e, refresh));
    }, [user?.id]);

    const send = async (text: string) => {
        if (!user?.id) return;
        // A retry replaces the failure message instead of repeating the question in the thread.
        setMessages((m) => (m[m.length - 1]?.retry === text ? m.slice(0, -1) : [...m, { role: 'user', text }]));
        setSending(true);
        try {
            const answer = await getAIResponse(text, user.id, facts);
            setMessages((m) => [...m, { role: 'assistant', text: answer, link: linkFor(answer) }]);
        } catch {
            setMessages((m) => [...m, { role: 'assistant', text: 'I could not reach the AI just now.', retry: text }]);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <AssistView
                messages={messages}
                sending={sending}
                suggestions={SUGGESTIONS}
                onSend={(t) => void send(t)}
                onVoice={() => setVoice(true)}
                plan={plan}
                planning={planning}
                onMakePlan={async () => {
                    setPlanning(true);
                    try { setPlan((await featureExpansionApi.generateCoach())?.actions ?? []); }
                    catch { toast.error('Could not make a plan right now.'); }
                    finally { setPlanning(false); }
                }}
                onToggle={async (a) => {
                    const status = a.status === 'done' ? 'pending' : 'done';
                    setPlan((p) => p?.map((x) => (x.id === a.id ? { ...x, status } : x)) ?? p);
                    try { await featureExpansionApi.updateCoachAction(a.id, status); }
                    catch { setPlan((p) => p?.map((x) => (x.id === a.id ? { ...x, status: a.status } : x)) ?? p); toast.error('Could not update that.'); }
                }}
                insights={insights}
            />
            <VoiceCallModal isOpen={voice} onClose={() => setVoice(false)} voiceName="jenny" userId={user?.id || ''} userName={user?.name?.split(' ')[0] || 'there'} />
        </>
    );
};

export default InsightsPage;
