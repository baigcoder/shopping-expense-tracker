// Spending Chart Component
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MonthlySpending } from '../types';
import { formatCurrency, getCurrencySymbol } from '../services/currencyService';

interface SpendingChartProps {
    data: MonthlySpending[];
}

const SpendingChart = ({ data }: SpendingChartProps) => {
    // Format month labels
    const formattedData = data.map(item => ({
        ...item,
        monthLabel: new Date(item.month + '-01').toLocaleDateString('en-US', {
            month: 'short'
        })
    }));

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>
                        {label}
                    </p>
                    <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="monthLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    tickFormatter={(value) => `${getCurrencySymbol()}${value}`}
                    width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSpending)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default SpendingChart;
