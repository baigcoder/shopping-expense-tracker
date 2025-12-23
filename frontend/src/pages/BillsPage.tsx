import StaticPageTemplate from '../components/StaticPageTemplate';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, FileText } from 'lucide-react';

const BillsPage = () => {
    const bills = [
        { name: 'Electric Bill', amount: 120, dueDate: '2024-12-25', status: 'Pending' },
        { name: 'Water Bill', amount: 45, dueDate: '2024-12-20', status: 'Paid' },
        { name: 'Internet', amount: 79.99, dueDate: '2024-12-15', status: 'Overdue' },
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight font-display">Bills & Utilities</h1>
            <p className="text-muted-foreground">Manage your recurring bills</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bills.map((bill, i) => (
                    <Card key={i} className="p-4">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <h3 className="font-semibold">{bill.name}</h3>
                                </div>
                                <Badge
                                    variant={bill.status === 'Paid' ? 'default' : bill.status === 'Overdue' ? 'destructive' : 'secondary'}
                                >
                                    {bill.status}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-2xl font-bold">${bill.amount}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Due: {bill.dueDate}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default BillsPage;
