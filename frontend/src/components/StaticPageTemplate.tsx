// Simple Static Page Template
// Use this pattern for: PrivacyPolicy, Terms, FAQ, Contact, etc.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StaticPageTemplateProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

const StaticPageTemplate = ({ title, subtitle, children }: StaticPageTemplateProps) => {
    const navigate = useNavigate();

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <h1 className="text-4xl font-bold tracking-tight font-display">{title}</h1>
                {subtitle && <p className="text-muted-foreground text-lg">{subtitle}</p>}
            </div>

            {/* Content */}
            <Card>
                <CardContent className="pt-6 prose prose-slate dark:prose-invert max-w-none">
                    {children}
                </CardContent>
            </Card>
        </div>
    );
};

export default StaticPageTemplate;
