import { memo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export interface ChartDatum {
    day: string;
    income: number;
    expense: number;
}

interface Props {
    data: ChartDatum[];
}

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 shadow-xl backdrop-blur-md">
            <p className="text-[10px] font-mono font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 border-b border-[var(--color-border)] pb-1">
                {payload[0].payload.day}
            </p>
            {payload.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 mt-1 font-mono text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[var(--color-muted)] uppercase">{entry.name}:</span>
                    </div>
                    <span className="font-bold text-[var(--color-ink)] tabular-nums">Rs {entry.value.toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

const SpendingChartBase = ({ data }: Props) => {
    const hasData = data && data.some(d => (d.income > 0 || d.expense > 0));

    if (!hasData) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center rounded-xl bg-[var(--color-surface-2)]/30 border border-dashed border-[var(--color-border)]">
                <div className="w-10 h-10 rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[var(--color-ink)]">
                    No Discretionary Burn in Current 14-Day Window
                </p>
                <p className="text-[11px] text-[var(--color-muted)] max-w-sm mt-1">
                    Transactions approved from your review inbox or logged manually will dynamically draw your cumulative cash trajectory here.
                </p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EE5024" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#EE5024" stopOpacity={0.0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                    dataKey="day"
                    axisLine={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
                    tickLine={false}
                    tick={{ fill: 'var(--color-muted)', fontSize: 10, fontFamily: 'monospace' }}
                    dy={10}
                />
                <YAxis
                    axisLine={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
                    tickLine={false}
                    tick={{ fill: 'var(--color-muted)', fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={(v: number) => `Rs ${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#incomeGrad)"
                    name="Inflow"
                    isAnimationActive={false}
                />
                <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#EE5024"
                    strokeWidth={2}
                    fill="url(#expenseGrad)"
                    name="Outflow"
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export const SpendingChart = memo(SpendingChartBase);
SpendingChart.displayName = 'SpendingChart';
