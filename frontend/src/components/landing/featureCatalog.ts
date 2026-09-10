import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    BarChart3,
    Bell,
    Brain,
    CalendarDays,
    Chrome,
    ClipboardList,
    CreditCard,
    FileText,
    Inbox,
    Landmark,
    LayoutDashboard,
    Mic,
    PiggyBank,
    ReceiptText,
    Repeat,
    Settings,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Target,
    UploadCloud,
    WalletCards,
} from 'lucide-react';

export type FeatureItem = {
    icon: LucideIcon;
    title: string;
    description: string;
};

export type FeatureGroup = {
    id: string;
    title: string;
    description: string;
    features: FeatureItem[];
};

export const HOW_IT_WORKS = [
    {
        title: 'Capture in the browser',
        body: 'Install the extension and shop as usual. Checkouts, trials, and statement files queue up — Cashly never asks for your bank password.',
    },
    {
        title: 'Review before it posts',
        body: 'Inbox holds each detection. Approve, edit, merge a duplicate, reject it, or save a merchant rule so the next one can skip the queue.',
    },
    {
        title: 'Plan the month',
        body: 'Budgets, bills, subscriptions, goals, cards, and the cashflow calendar all read the same approved ledger.',
    },
    {
        title: 'Analyze what happened',
        body: 'Charts, Money Twin forecasts, weekly AI actions, and downloadable reports use real numbers — pending inbox items stay labeled as pending.',
    },
];

export const FEATURE_GROUPS: FeatureGroup[] = [
    {
        id: 'capture',
        title: 'Capture and review',
        description: 'Nothing becomes official until you say so. Detections, imports, and rules all land in one queue.',
        features: [
            { icon: Inbox, title: 'Transaction inbox', description: 'Approve, reject, edit, or merge captured purchases before they enter the ledger.' },
            { icon: Chrome, title: 'Browser extension', description: 'Notices checkouts and subscriptions on supported sites, then syncs them to Cashly.' },
            { icon: UploadCloud, title: 'Statement import', description: 'CSV, Excel, PDF, and receipt images parse into review rows with confidence and errors.' },
            { icon: ClipboardList, title: 'Merchant rules', description: 'Match a store, pick a category, and skip the inbox when you trust the capture.' },
            { icon: ReceiptText, title: 'Manual add', description: 'Log cash or anything the extension missed, posted straight to your ledger.' },
            { icon: CreditCard, title: 'Cards', description: 'Save cards for capture context, freeze one, and set a spending limit.' },
            { icon: ShoppingBag, title: 'Shopping activity', description: 'See which shopping and payment sites the extension has visited recently.' },
            { icon: Activity, title: 'Extension health', description: 'Tracked sites, queued syncs, failed detections, and recent capture events.' },
        ],
    },
    {
        id: 'planning',
        title: 'Planning',
        description: 'Upcoming money sits next to what already posted, so the month stays honest.',
        features: [
            { icon: LayoutDashboard, title: 'Dashboard', description: 'Balance, money in and out, budgets, merchants, and live capture in one calm home.' },
            { icon: CalendarDays, title: 'Cashflow calendar', description: 'Income, bills, subscriptions, and predicted spend on a single timeline.' },
            { icon: Target, title: 'Budgets', description: 'Category limits next to real transactions, not a separate spreadsheet.' },
            { icon: PiggyBank, title: 'Goals', description: 'Savings targets with progress that updates as you approve spend.' },
            { icon: Landmark, title: 'Accounts', description: 'Checking, savings, and other balances you track alongside cards.' },
            { icon: Repeat, title: 'Subscriptions', description: 'Recurring charges, trials, price changes, and services you barely use.' },
            { icon: Bell, title: 'Bills and reminders', description: 'What is due next, what is overdue, and a nudge before it slips.' },
        ],
    },
    {
        id: 'analyze',
        title: 'Analyze',
        description: 'Charts, forecasts, and AI all read the same ledger. Pending captures are never treated as spent.',
        features: [
            { icon: BarChart3, title: 'Analytics', description: 'Week, month, or year. Online vs in store, categories, and top merchants.' },
            { icon: Sparkles, title: 'Money Twin', description: 'A forecast of daily spend, headroom, and alerts when the pattern shifts.' },
            { icon: Brain, title: 'AI assistant', description: 'A weekly plan with a few concrete actions, plus chat grounded in your numbers.' },
            { icon: Mic, title: 'Voice', description: 'Ask about spending out loud. Keys stay on the server, not in the browser.' },
            { icon: FileText, title: 'Reports', description: 'Monthly, tax, category, merchant, and subscription summaries you can download.' },
        ],
    },
    {
        id: 'system',
        title: 'Account and privacy',
        description: 'Preferences and AI live in one place. Secrets never ship in the frontend.',
        features: [
            { icon: Settings, title: 'Settings', description: 'Name, currency, notifications, sounds, and which AI memory to keep.' },
            { icon: ShieldCheck, title: 'Server-side AI', description: 'Groq and voice run on the backend. You choose live answers, memory, and inbox context.' },
            { icon: WalletCards, title: 'One currency', description: 'Your preference formats money the same way across dashboard, inbox, and reports.' },
        ],
    },
];

export const ANALYZE_HIGHLIGHTS = [
    {
        eyebrow: 'Charts',
        title: 'Analytics',
        body: 'See spending by week, month, or year. Compare online and in-store, split by category, and rank the merchants you visit most.',
        points: ['Week / month / year', 'Online vs in store', 'Top merchants'],
    },
    {
        eyebrow: 'Forecast',
        title: 'Money Twin',
        body: 'A quieter twin of your spending: daily rate, this month’s pace, and a warning when something looks off.',
        points: ['Daily spend', 'Runway and headroom', 'Pattern alerts'],
    },
    {
        eyebrow: 'Advice',
        title: 'AI coach and voice',
        body: 'A short weekly plan, chat about this month, and optional voice. Pending inbox items stay labeled so advice is not guessing.',
        points: ['Weekly actions', 'Ask about spending', 'Voice, if you want it'],
    },
];
