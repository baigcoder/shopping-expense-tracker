// Cashly Landing Page - Midnight Coral Design System
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    Chrome, ArrowRight, Sparkles, CreditCard, PieChart, Target,
    Bell, Zap, Menu, X, CheckCircle, Brain, Shield, TrendingUp,
    BarChart3, Wallet, Clock, Users, Star, Play, ArrowUpRight,
    ChevronDown, MousePointer, Smartphone, Moon, Sun, Receipt,
    DollarSign, Lock, Globe, ChevronRight, Activity, Fingerprint
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import BRAND from '@/config/branding';

const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { scrollY } = useScroll();

    const yHero = useTransform(scrollY, [0, 500], [0, 150]);
    const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);

    useEffect(() => {
        // Force light mode
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);


    const stats = [
        { label: "Active Users", value: "50K+", icon: Users },
        { label: "Transactions", value: "2M+", icon: Activity },
        { label: "Avg Savings", value: "$432", icon: Wallet },
        { label: "User Rating", value: "4.9★", icon: Star },
    ];

    const features = [
        {
            title: "Smart Auto-Detection",
            description: "Automatically detects checkout pages and logs transactions from 50+ supported stores.",
            icon: Zap,
            color: "teal"
        },
        {
            title: "AI-Powered Insights",
            description: "MoneyTwin analyzes your spending patterns and suggests ways to save more.",
            icon: Brain,
            color: "coral"
        },
        {
            title: "Bank-Level Security",
            description: "Your data is encrypted end-to-end. We never store or sell your information.",
            icon: Shield,
            color: "teal"
        },
        {
            title: "Multi-Currency",
            description: "Track expenses in 150+ currencies with real-time conversion rates.",
            icon: Globe,
            color: "coral"
        },
        {
            title: "Smart Budgets",
            description: "Set category budgets and get alerts before you overspend.",
            icon: Target,
            color: "teal"
        },
        {
            title: "Receipt Scanner",
            description: "Snap a photo of any receipt and we'll extract the details automatically.",
            icon: Receipt,
            color: "coral"
        }
    ];

    const howItWorks = [
        { step: "01", title: "Install Extension", description: "Add Cashly to Chrome in one click.", icon: Chrome },
        { step: "02", title: "Shop Normally", description: "Browse and buy as you always do.", icon: MousePointer },
        { step: "03", title: "Auto-Track", description: "Expenses are logged automatically.", icon: BarChart3 },
        { step: "04", title: "Get Insights", description: "View analytics in your dashboard.", icon: TrendingUp },
    ];

    const testimonials = [
        { text: "Finally an expense tracker that actually works automatically. Game changer!", name: "Sarah K.", role: "Freelancer", rating: 5 },
        { text: "The AI insights helped me cut my subscriptions by 40%. Love this app.", name: "Mike T.", role: "Developer", rating: 5 },
        { text: "Clean design, works seamlessly. Replaced 3 other apps with just Cashly.", name: "Priya R.", role: "Designer", rating: 5 },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">

            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px] opacity-60" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px] opacity-50" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all">
                            <span className="font-display font-bold text-xl">C</span>
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">{BRAND.name}</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
                        <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Reviews</a>

                        <div className="flex items-center gap-3 ml-2">
                            <Link to="/login">
                                <Button variant="ghost" className="font-medium">Log in</Button>
                            </Link>
                            <Link to="/signup">
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>


                    <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden fixed top-20 left-0 right-0 bg-background border-b z-40 px-6 py-6 shadow-xl"
                    >
                        <div className="flex flex-col gap-4">
                            <a href="#features" className="text-lg font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
                            <a href="#how-it-works" className="text-lg font-medium py-2" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
                            <hr className="border-border" />
                            <Link to="/login" className="text-lg font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                            <Link to="/signup">
                                <Button className="w-full bg-primary text-primary-foreground">Get Started</Button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section - Updated to Light Indigo */}
            <section className="pt-32 pb-20 md:pt-44 md:pb-32 px-4 md:px-6 relative bg-white overflow-hidden">
                {/* Hero Specific Mesh Gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
                                <Sparkles className="h-4 w-4" />
                                <span>AI-Powered Finance Tracking</span>
                            </div>

                            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-slate-900">
                                Your Money, <br />
                                <span className="text-primary">
                                    Simplified.
                                </span>
                            </h1>


                            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
                                Stop tracking expenses manually. Cashly auto-detects purchases, categorizes spending, and shows you exactly where your money goes.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-14">
                                <Link to="/signup">
                                    <Button size="lg" className="h-14 px-8 w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1 text-base font-semibold">
                                        Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Button size="lg" variant="outline" className="h-14 px-8 w-full sm:w-auto rounded-xl border-2 hover:bg-muted/50 text-base font-medium">
                                    <Chrome className="mr-2 h-5 w-5" /> Install Extension
                                </Button>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {stats.map((stat, i) => (
                                    <div key={i} className="text-center md:text-left">
                                        <div className="text-2xl md:text-3xl font-bold font-display text-slate-900">{stat.value}</div>
                                        <div className="text-xs md:text-sm text-slate-500 font-medium mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Dashboard Preview */}
                        <motion.div
                            style={{ y: yHero, opacity: opacityHero }}
                            className="relative hidden lg:block"
                        >
                            <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl opacity-40" />
                            <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                                {/* Browser Chrome */}
                                <div className="h-12 border-b border-border bg-muted/50 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                    <div className="ml-4 flex-1 h-7 bg-muted rounded-lg flex items-center px-3">
                                        <Lock className="h-3 w-3 text-muted-foreground mr-2" />
                                        <span className="text-xs text-muted-foreground">app.cashly.io/dashboard</span>
                                    </div>
                                </div>

                                {/* Dashboard Content */}
                                <div className="p-5 bg-card">
                                    {/* Header Row */}
                                    <div className="flex justify-between items-start mb-5">
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Spent</div>
                                            <div className="text-3xl font-bold font-display tracking-tight text-slate-900">$4,285.50</div>
                                            <div className="text-xs text-slate-500 mt-1">This month</div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
                                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                                <TrendingUp className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-primary">−12%</div>
                                                <div className="text-[10px] text-slate-500">vs last month</div>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Chart Area */}
                                    <div className="h-36 bg-muted/30 rounded-xl border border-border/50 mb-4 flex items-end justify-between p-3 gap-1.5">
                                        {[35, 55, 40, 70, 45, 85, 60, 75, 50, 65, 80, 55].map((h, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-primary rounded-t opacity-80 hover:opacity-100 transition-opacity"
                                                style={{ height: `${h}%` }}
                                            />
                                        ))}
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-slate-100 rounded-xl p-3 border border-slate-200">
                                            <div className="text-[10px] text-slate-500 font-medium mb-1">Transactions</div>
                                            <div className="text-lg font-bold font-display text-slate-900">127</div>
                                        </div>
                                        <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                                            <div className="text-[10px] text-primary font-semibold mb-1">Saved</div>
                                            <div className="text-lg font-bold font-display text-primary">$432</div>
                                        </div>
                                        <div className="bg-slate-100 rounded-xl p-3 border border-slate-200">
                                            <div className="text-[10px] text-slate-500 font-medium mb-1">Budget Left</div>
                                            <div className="text-lg font-bold font-display text-slate-900">68%</div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Floating Notification Card */}
                            <motion.div
                                className="absolute -right-4 top-24 bg-card border border-border rounded-xl p-3 shadow-xl"
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                                        <Zap className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold">Purchase tracked!</div>
                                        <div className="text-[10px] text-muted-foreground">Amazon • $24.99</div>
                                    </div>
                                </div>
                            </motion.div>

                        </motion.div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <ChevronDown className="h-6 w-6 text-muted-foreground/50" />
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                            <Zap className="h-4 w-4" />
                            <span>Powerful Features</span>
                        </div>
                        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-slate-900">Everything you need</h2>
                        <p className="text-muted-foreground text-lg">Built for people who want to take control of their finances without the hassle.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="p-8 h-full bg-white hover:shadow-2xl transition-all duration-500 group border-border/40 hover:border-primary/40 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-500" />

                                    <motion.div
                                        className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-all duration-500",
                                            feature.color === 'teal'
                                                ? "bg-primary text-white shadow-primary/20"
                                                : "bg-blue-600 text-white shadow-blue-600/20"
                                        )}
                                        animate={{
                                            y: [0, -5, 0],
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: i * 0.2
                                        }}
                                    >
                                        <feature.icon className="h-7 w-7" />
                                    </motion.div>
                                    <h3 className="font-display text-2xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                                    <p className="text-slate-600 leading-relaxed text-base">{feature.description}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-slate-900">How it works</h2>
                        <p className="text-muted-foreground text-lg">Get started in under 2 minutes. No credit card required.</p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border hidden md:block" style={{ transform: 'translateY(-50%)' }} />

                        <div className="grid md:grid-cols-4 gap-8">
                            {howItWorks.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.15 }}
                                    className="relative text-center"
                                >
                                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 relative z-10">
                                        <item.icon className="h-7 w-7" />
                                    </div>
                                    <div className="text-xs font-bold text-primary mb-2">{item.step}</div>
                                    <h3 className="font-display text-lg font-bold mb-2 text-slate-900">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm">{item.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-slate-900">Loved by thousands</h2>
                        <p className="text-muted-foreground text-lg">Join 50,000+ users who track their finances with Cashly.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="p-6 h-full bg-card border-border/50">
                                    <div className="flex gap-0.5 mb-4">
                                        {[...Array(t.rating)].map((_, j) => (
                                            <Star key={j} className="h-5 w-5 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-foreground mb-6 leading-relaxed">"{t.text}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                                            {t.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">{t.name}</div>
                                            <div className="text-sm text-muted-foreground">{t.role}</div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="relative bg-primary rounded-3xl p-12 text-center text-white overflow-hidden shadow-2xl shadow-primary/30">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

                        <div className="relative z-10">
                            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">Ready to simplify your finances?</h2>
                            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                                Join 50,000+ users who save time and money with automated expense tracking.
                            </p>
                            <Link to="/signup">
                                <Button size="lg" className="h-14 px-10 rounded-xl bg-white text-primary hover:bg-white/90 text-base font-bold shadow-xl transition-all hover:scale-105">
                                    Get Started for Free
                                </Button>
                            </Link>
                            <p className="mt-6 text-sm text-white/60">No credit card required • Cancel anytime</p>
                        </div>
                    </div>
                </div>
            </section>


            {/* Footer */}
            <footer className="bg-card border-t border-border py-16 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white text-xl font-bold">💸</div>
                            <span className="font-display font-bold text-xl">{BRAND.name}</span>
                        </div>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            The smartest way to track expenses and save money. Automated, secure, and beautifully designed.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-12.7 12.5S5.2 6.1 11 5c2.8-.5 5.2.2 5.2.2L22 4z" /></svg>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.4 1.2a11.8 11.8 0 0 1 6.2 0c2.3-1.5 3.4-1.2 3.4-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.7 5.6-5.3 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" /></svg>
                            </a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-foreground">Product</h4>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Extension</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-foreground">Company</h4>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                    © 2024 {BRAND.name}. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
