// Cashly Auth Layout - Midnight Coral Theme
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Shield, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import BRAND from '@/config/branding';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
    return (
        <div className="h-screen flex overflow-hidden">
            {/* Visual Side (Left) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white font-bold text-xl">C</span>
                        </div>
                        <span className="text-white font-display font-bold text-xl">{BRAND.name}</span>
                    </div>

                    {/* Center Content */}
                    <div className="flex-1 flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="w-full max-w-md"
                        >
                            {/* Dashboard Preview Card */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <CreditCard className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-white">
                                        <div className="font-bold text-lg">Total Spending</div>
                                        <div className="text-white/70 text-sm">This Month</div>
                                    </div>
                                </div>

                                <div className="text-4xl font-bold text-white mb-6 font-display">
                                    $2,847.50
                                </div>

                                {/* Mini Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                                        <TrendingUp className="w-5 h-5 text-accent mb-2" />
                                        <div className="text-white/80 text-sm">AI Insights</div>
                                        <div className="text-accent font-bold">Active</div>
                                    </div>
                                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                                        <Shield className="w-5 h-5 text-green-400 mb-2" />
                                        <div className="text-white/80 text-sm">Secure Sync</div>
                                        <div className="text-green-400 font-bold">Online</div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature Pills */}
                            <div className="flex flex-wrap gap-2 mt-6 justify-center">
                                <div className="px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> Auto-tracking
                                </div>
                                <div className="px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" /> Real-time stats
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Quote */}
                    <div className="text-white/70">
                        <p className="text-lg italic mb-2">
                            "Finally, an expense tracker that works automatically. Game changer!"
                        </p>
                        <p className="text-sm text-white/50">
                            — Sarah K., Freelance Designer
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Side (Right) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <Link to="/" className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-white font-bold text-xl">C</span>
                        </div>
                        <span className="font-display font-bold text-xl">{BRAND.name}</span>
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight mb-2">
                            {title}
                        </h1>
                        <p className="text-muted-foreground text-lg mb-8">
                            {subtitle}
                        </p>

                        {children}
                    </motion.div>

                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground mt-8">
                        By continuing, you agree to our{' '}
                        <a href="/terms" className="text-primary hover:underline">Terms</a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
