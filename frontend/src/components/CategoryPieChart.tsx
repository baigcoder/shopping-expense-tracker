// Category Pie Chart Component
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { CategorySpending } from '../types';

interface CategoryPieChartProps {
    data: CategorySpending[];
}

const CategoryPieChart = ({ data }: CategoryPieChartProps) => {
    if (!data || data.length === 0) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)'
            }}>
                No data available
            </div>
        );
    }

    const chartData = data.slice(0, 5).map(item => ({
        name: item.categoryName,
        value: item.total,
        color: item.categoryColor,
        icon: item.categoryIcon
    }));

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
        cx: number;
        cy: number;
        midAngle: number;
        innerRadius: number;
        outerRadius: number;
        percent: number;
    }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null;

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={600}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    const CustomLegend = ({ payload }: { payload?: { value: string; color: string }[] }) => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '16px'
        }}>
            {payload?.map((entry, index) => (
                <div
                    key={`legend-${index}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.75rem'
                    }}
                >
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: entry.color,
                            flexShrink: 0
                        }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>
                        {chartData[index]?.icon} {entry.value}
                    </span>
                </div>
            ))}
        </div>
    );

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Legend
                    content={<CustomLegend />}
                    verticalAlign="bottom"
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default CategoryPieChart;
