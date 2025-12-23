import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, FileText, Calendar } from 'lucide-react';

const RecurringPage = () => {
    const recurring = [
        { name: 'Gym Membership', amount: 50, frequency: 'Monthly', nextDate: '2024-01-01' },
        { name: 'Car Insurance', amount: 150, frequency: 'Monthly', nextDate: '2024-01-05' },
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight font-display">Recurring Payments</h1>
            <p className="text-muted-foreground">Track your regular expenses</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recurring.map((item, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-primary" />
                                <CardTitle>{item.name}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-2xl font-bold">${item.amount}</div>
                            <div className="text-sm text-muted-foreground">{item.frequency}</div>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4" />
                                Next: {item.nextDate}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default RecurringPage;
