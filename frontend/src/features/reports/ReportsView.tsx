import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { buildReport, type ReportRange, type ReportTx } from './reportModel';
import { cn } from '@/lib/utils';

interface ReportsViewProps { transactions: ReportTx[]; money: (n: number) => string; now?: Date; loading?: boolean }

const RANGES: [ReportRange, string][] = [['month', 'This month'], ['last-month', 'Last month'], ['quarter', '3 months'], ['tax-year', 'Tax year'], ['year', 'This year'], ['all', 'All']];
const fmt = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); };
const FORMATS = [['csv', 'CSV'], ['excel', 'Excel'], ['pdf', 'PDF']] as const;

export function ReportsView({ transactions, money, now = new Date(), loading }: ReportsViewProps) {
    const [range, setRange] = useState<ReportRange>('month');
    const [busy, setBusy] = useState<string | null>(null);
    const r = useMemo(() => buildReport(transactions, range, now), [transactions, range, now]);

    // Files are built in the browser, so the demo downloads its sample data the same way.
    const download = async (format: (typeof FORMATS)[number][0]) => {
        setBusy(format);
        try {
            const x = await import('@/services/exportService');
            const rows = r.rows.map(({ id, date, description, amount, type, category }) => ({ id, date, description, amount, type, category }));
            const filename = `cashly-${r.from || r.rows[r.rows.length - 1]?.date.slice(0, 10) || 'start'}-to-${r.to}`;
            if (format === 'csv') x.exportToCSV(rows, { filename, includeSummary: true });
            else if (format === 'excel') await x.exportToExcel(rows, { filename });
            else await x.exportTransactionsToPDF(rows, { filename, dateRange: { start: r.from || rows[rows.length - 1]?.date || '', end: r.to } });
        } catch {
            toast.error('That download did not work. Try again.');
        } finally {
            setBusy(null);
        }
    };

    const figures = [
        { label: 'Money in', value: money(r.in), tone: 'text-[var(--color-success)]' },
        { label: 'Spent', value: money(r.out), tone: '' },
        { label: r.saved >= 0 ? 'Kept' : 'Overspent', value: money(Math.abs(r.saved)), tone: r.saved >= 0 ? '' : 'text-[var(--color-danger)]', note: r.rate !== null && r.saved >= 0 ? `${Math.round(r.rate * 100)}% of what came in` : undefined },
    ];

    return (
        <div className="flex flex-col gap-4">
            <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
                <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Reports</h1>
                {/* Six periods do not fit a phone's width, so phones get the same choice as a list. */}
                <select aria-label="Period" value={range} onChange={(e) => setRange(e.target.value as ReportRange)} className="h-11 rounded-full bg-[var(--color-surface)] px-4 text-[15px] font-medium md:hidden">
                    {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <div role="tablist" aria-label="Period" className="hidden max-w-full overflow-x-auto rounded-full bg-[var(--color-surface)] p-1 md:inline-flex">
                    {RANGES.map(([v, l]) => (
                        <button key={v} type="button" role="tab" aria-selected={range === v} onClick={() => setRange(v)}
                            className={cn('h-9 shrink-0 rounded-full px-4 text-[14px] font-medium', range === v ? 'bg-[var(--color-ink)] text-[var(--color-on-ink)]' : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]')}>{l}</button>
                    ))}
                </div>
            </header>

            {!loading && r.rows.length > 0 && (
                <p className="-mb-2 px-1 text-[15px] tabular-nums text-[var(--color-ink-secondary)]">{fmt(r.from || r.rows[r.rows.length - 1].date.slice(0, 10))} to {fmt(r.to)}</p>
            )}
            <section className="grid grid-cols-[minmax(0,1fr)] gap-6 rounded-[20px] bg-[var(--color-surface)] p-5 sm:grid-cols-3 sm:p-6" aria-label="Totals" data-tour="reports-totals">
                {figures.map((f) => (
                    <div key={f.label}>
                        <p className="text-[14px] text-[var(--color-ink-secondary)]">{f.label}</p>
                        <p className={cn('mt-1 font-display text-[28px] font-bold tracking-tight tabular-nums sm:text-[32px]', f.tone)}>{loading ? '…' : f.value}</p>
                        {f.note && <p className="mt-1 text-[13px] text-[var(--color-muted)]">{f.note}</p>}
                    </div>
                ))}
            </section>

            <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="stmt-h">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <h2 id="stmt-h" className="font-display text-[17px] font-semibold">Month by month</h2>
                    <div className="flex gap-2" data-tour="reports-download" aria-label={`Download ${r.rows.length} transactions`} role="group">
                        {FORMATS.map(([f, l]) => (
                            <button key={f} type="button" onClick={() => download(f)} disabled={!!busy || r.rows.length === 0}
                                className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-canvas)] px-4 text-[14px] font-medium hover:bg-[var(--color-surface-2)] disabled:opacity-50">
                                <Download size={15} aria-hidden />{busy === f ? 'Preparing…' : l}
                            </button>
                        ))}
                    </div>
                </div>
                {r.months.length === 0 ? <p className="text-[15px] text-[var(--color-ink-secondary)]">Nothing in this period yet.</p> : (
                    <table className="w-full text-[15px]">
                        <thead>
                            <tr className="text-[13px] text-[var(--color-muted)]">
                                <th className="py-2 text-left font-normal">Month</th>
                                <th className="py-2 text-right font-normal">In</th>
                                <th className="py-2 text-right font-normal">Spent</th>
                                <th className="hidden py-2 text-right font-normal sm:table-cell">Kept</th>
                            </tr>
                        </thead>
                        <tbody>
                            {r.months.map((m) => (
                                <tr key={m.key} className="border-t border-[var(--color-surface-2)]">
                                    <td className="py-3 font-medium">{m.label}</td>
                                    <td className="py-3 text-right tabular-nums text-[var(--color-success)]">{money(m.in)}</td>
                                    <td className="py-3 text-right tabular-nums">{money(m.out)}</td>
                                    <td className={cn('hidden py-3 text-right tabular-nums sm:table-cell', m.in - m.out < 0 && 'text-[var(--color-danger)]')}>{money(m.in - m.out)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}
