// Memoized spending chart. Recharts is heavy; this component re-renders only
// when `chartData` reference changes. Animation is disabled on the dashboard
// preview (kept only on the dedicated Analytics page).
import { memo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid
} from 'recharts';

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
        <div className="bg-white border-[3px] border-black p-4 shadow-[6px_6px_0px_#000000]">
            <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1">
                {payload[0].payload.day}
            </p>
            {payload.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 mt-1">
                    <div className="w-3 h-3 border-2 border-black" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-black text-black uppercase tracking-tighter">{entry.name}:</span>
                    <span className="text-sm font-black text-black">Rs{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

const SpendingChartBase = ({ data }: Props) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" vertical={true} />
            <XAxis
                dataKey="day"
                axisLine={{ stroke: '#000000', strokeWidth: 3 }}
                tickLine={false}
                tick={{ fill: '#000000', fontSize: 10, fontWeight: 900 }}
                dy={10}
            />
            <YAxis
                axisLine={{ stroke: '#000000', strokeWidth: 3 }}
                tickLine={false}
                tick={{ fill: '#000000', fontSize: 10, fontWeight: 900 }}
                tickFormatter={(v: number) => `Rs${v}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
                type="stepAfter"
                dataKey="income"
                stroke="#000000"
                strokeWidth={4}
                fill="#000000"
                fillOpacity={0.1}
                name="Inflow"
                isAnimationActive={false}
                activeDot={{ r: 8, strokeWidth: 3, stroke: '#000000', fill: '#FFFFFF' }}
            />
            <Area
                type="stepAfter"
                dataKey="expense"
                stroke="#E11D48"
                strokeWidth={4}
                fill="#E11D48"
                fillOpacity={0.1}
                name="Outflow"
                isAnimationActive={false}
            />
        </AreaChart>
    </ResponsiveContainer>
);

export const SpendingChart = memo(SpendingChartBase);
SpendingChart.displayName = 'SpendingChart';
