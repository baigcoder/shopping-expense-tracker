// FeaturesPage.tsx - Comprehensive Features Showcase with Premium Animations
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Chrome, ArrowRight, Sparkles, CreditCard, PieChart, Target,
    Bell, Zap, Brain, Shield, TrendingUp, BarChart3, Wallet,
    Clock, Receipt, Lock, Smartphone, FileText, Calendar,
    DollarSign, RefreshCw, Eye, Layers, Globe, Cpu, Bot,
    LineChart, CircleDollarSign, Banknote, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import BRAND from '@/config/branding';

const FeaturesPage = () => {
    // Feature categories with comprehensive features
    const featureCategories = [
        {
            title: 'Core Tracking',
            subtitle: 'Automatic expense tracking that just works',
            badge: { text: 'Essential', color: 'emerald' },
            features: [
                {
                    icon: Chrome,
                    title: 'Browser Extension',
                    description: 'Automatically captures purchases from 1000+ websites as you shop. No manual entry required.',
                    gradient: 'from-emerald-500 to-teal-500'
                },
                {
                    icon: Receipt,
                    title: 'Receipt Scanner',
                    description: 'Snap photos of paper receipts and let AI extract the data automatically.',
                    gradient: 'from-emerald-500 to-green-600'
                },
                {
                    icon: RefreshCw,
                    title: 'Real-Time Sync',
                    description: 'All your devices stay in sync. Add expenses from anywhere, see them everywhere.',
                    gradient: 'from-teal-500 to-cyan-500'
                },
                {
                    icon: Layers,
                    title: 'Multi-Currency',
                    description: 'Track expenses in any currency with automatic conversion to your preferred currency.',
                    gradient: 'from-cyan-500 to-blue-500'
                }
            ]
        },
        {
            title: 'AI-Powered Intelligence',
            subtitle: 'Smart insights that help you save more',
            badge: { text: 'AI Enhanced', color: 'violet' },
            features: [
                {
                    icon: Brain,
                    title: 'MoneyTwin AI',
                    description: 'Your personal AI financial advisor. Get personalized tips based on your spending patterns.',
                    gradient: 'from-violet-500 to-purple-500'
                },
                {
                    icon: Bot,
                    title: 'Smart Categorization',
                    description: 'AI automatically categorizes your transactions with 99% accuracy. Learns from your corrections.',
                    gradient: 'from-purple-500 to-fuchsia-500'
                },
                {
                    icon: Eye,
                    title: 'Spending Predictions',
                    description: 'Know what you\'ll spend before you spend it. AI predicts monthly expenses based on patterns.',
                    gradient: 'from-fuchsia-500 to-pink-500'
                },
                {
                    icon: TrendingUp,
                    title: 'Savings Recommendations',
                    description: 'Discover hidden savings opportunities. AI identifies subscriptions and expenses you can reduce.',
                    gradient: 'from-pink-500 to-rose-500'
                }
            ]
        },
        {
            title: 'Financial Tools',
            subtitle: 'Everything you need to master your money',
            badge: { text: 'Pro Tools', color: 'amber' },
            features: [
                {
                    icon: Target,
                    title: 'Smart Budgets',
                    description: 'Set category budgets with intelligent alerts before you overspend. Track progress visually.',
                    gradient: 'from-amber-500 to-orange-500'
                },
                {
                    icon: Wallet,
                    title: 'Savings Goals',
                    description: 'Set financial goals and track progress. Whether it\'s a vacation or emergency fund, we\'ve got you.',
                    gradient: 'from-orange-500 to-red-500'
                },
                {
                    icon: Calendar,
                    title: 'Bill Reminders',
                    description: 'Never miss a payment. Get notifications before bills are due with due date tracking.',
                    gradient: 'from-red-500 to-rose-600'
                },
                {
                    icon: CircleDollarSign,
                    title: 'Subscription Tracker',
                    description: 'Track all recurring subscriptions in one place. Know exactly what you\'re paying monthly.',
                    gradient: 'from-rose-500 to-pink-600'
                }
            ]
        },
        {
            title: 'Analytics & Reporting',
            subtitle: 'Beautiful visualizations of your financial health',
            badge: { text: 'Insights', color: 'sky' },
            features: [
                {
                    icon: BarChart3,
                    title: 'Real-Time Analytics',
                    description: 'Beautiful dashboards with live charts showing spending by category, time period, and more.',
                    gradient: 'from-sky-500 to-blue-500'
                },
                {
                    icon: LineChart,
                    title: 'Trend Analysis',
                    description: 'See how your spending changes over time. Identify patterns and seasonal variations.',
                    gradient: 'from-blue-500 to-indigo-500'
                },
                {
                    icon: FileText,
                    title: 'PDF Reports',
                    description: 'Generate beautiful PDF reports for any time period. Perfect for taxes or personal review.',
                    gradient: 'from-indigo-500 to-violet-500'
                },
                {
                    icon: PieChart,
                    title: 'Category Breakdown',
                    description: 'Detailed pie charts showing exactly where your money goes each month.',
                    gradient: 'from-violet-500 to-purple-600'
                }
            ]
        },
        {
            title: 'Security & Privacy',
            subtitle: 'Bank-level security for your financial data',
            badge: { text: 'Secure', color: 'slate' },
            features: [
                {
                    icon: Shield,
                    title: 'Bank-Level Encryption',
                    description: '256-bit AES encryption protects all your data. Same security used by major banks.',
                    gradient: 'from-slate-500 to-gray-600'
                },
                {
                    icon: Lock,
                    title: 'Privacy First',
                    description: 'We never sell your data. Your financial information stays private, always.',
                    gradient: 'from-gray-500 to-zinc-600'
                },
                {
                    icon: CreditCard,
                    title: 'Secure Card Storage',
                    description: 'Store card details securely with tokenization. Never store full card numbers.',
                    gradient: 'from-zinc-500 to-neutral-600'
                },
                {
                    icon: Smartphone,
                    title: 'Biometric Auth',
                    description: 'Use fingerprint or face recognition for secure and fast access to your data.',
                    gradient: 'from-neutral-500 to-stone-600'
                }
            ]
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const getBadgeColors = (color: string) => {
        const colors: Record<string, string> = {
            emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700',
            violet: 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-700',
            amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700',
            sky: 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-700',
            slate: 'bg-slate-100 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600'
        };
        return colors[color] || colors.emerald;
    };

    return (
        <div className="min-h-screen bg-background overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-display text-xl font-bold tracking-tight">
                            <span className="text-gradient">Cashly</span>
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Home
                            </Button>
                        </Link>
                        <Link to="/signup">
                            <Button className="gradient-primary text-white shadow-lg shadow-emerald-500/25">
                                Get Started Free
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 mesh-gradient" />
                <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />

                <div className="relative max-w-7xl mx-auto px-4 md:px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-emerald-200 dark:border-emerald-700">
                            <Zap className="h-4 w-4" />
                            <span>20+ Powerful Features</span>
                        </div>

                        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                            <span className="text-foreground">Everything You Need</span>
                            <br />
                            <span className="text-gradient">to Master Your Money</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                            From automatic tracking to AI-powered insights, discover all the tools that make Cashly the ultimate expense management platform.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/signup">
                                <Button size="lg" className="h-14 px-8 text-lg gradient-primary text-white shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 w-full sm:w-auto group">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link to="/#pricing">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto border-2">
                                    View Pricing
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Feature Categories */}
            {featureCategories.map((category, categoryIndex) => (
                <section
                    key={categoryIndex}
                    className={cn(
                        "py-20 md:py-28",
                        categoryIndex % 2 === 0 ? "bg-muted/30" : "bg-background"
                    )}
                >
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <div className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border",
                                getBadgeColors(category.badge.color)
                            )}>
                                <Cpu className="h-4 w-4" />
                                <span>{category.badge.text}</span>
                            </div>
                            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                                {category.title}
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                {category.subtitle}
                            </p>
                        </motion.div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {category.features.map((feature, featureIndex) => (
                                <motion.div
                                    key={featureIndex}
                                    variants={itemVariants}
                                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                >
                                    <Card className="p-6 h-full bg-card border card-hover group relative overflow-hidden">
                                        {/* Gradient Overlay on Hover */}
                                        <div className={cn(
                                            "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br",
                                            feature.gradient
                                        )} />

                                        <div className="relative">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
                                                feature.gradient
                                            )}>
                                                <feature.icon className="h-7 w-7 text-white" />
                                            </div>
                                            <h3 className="font-display text-xl font-semibold mb-3">{feature.title}</h3>
                                            <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>
            ))}

            {/* CTA Section */}
            <section className="py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative rounded-3xl gradient-primary p-12 md:p-16 text-center text-white overflow-hidden"
                    >
                        {/* Pattern Overlay */}
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }} />
                        <div className="relative">
                            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                                Ready to Transform Your Finances?
                            </h2>
                            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
                                Join 50,000+ users who are already saving more and spending smarter with Cashly.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to="/signup">
                                    <Button size="lg" className="h-14 px-8 text-lg bg-white text-emerald-600 hover:bg-emerald-50 w-full sm:w-auto">
                                        Start Free Trial
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to="/">
                                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                                        Back to Home
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-8 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Cashly. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default FeaturesPage;
