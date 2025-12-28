// Main App with Routing
import React, { useEffect, lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/useStore';
import { supabase } from './config/supabase';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { DashboardSkeleton, Spinner } from './components/LoadingSkeleton';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
// Extension Integration
import ExtensionGate from './components/ExtensionGate';
import { Toaster } from 'sonner';
import './styles/toast.css'; // Custom toast styles

// ================================
// LAZY LOADED PAGES (Code Splitting)
// ================================

// Auth Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));

// Main Dashboard Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const CardsPage = lazy(() => import('./pages/CardsPage'));
const ExpenseDetailsPage = lazy(() => import('./pages/ExpenseDetailsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Feature Pages
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const BillsPage = lazy(() => import('./pages/BillsPage'));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const RecurringPage = lazy(() => import('./pages/RecurringPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const MoneyTwinPage = lazy(() => import('./pages/MoneyTwinPage'));
const BillRemindersPage = lazy(() => import('./pages/BillRemindersPage'));
const AITestPage = lazy(() => import('./pages/AITestPage'));
const ShoppingActivityPage = lazy(() => import('./pages/ShoppingActivityPage'));

// Public Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));

// Legal & Support Pages
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));



// Auth Callback Handler - handles both OAuth and Email Confirmation
const AuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser, setLoading } = useAuthStore();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Check URL hash for tokens (Supabase adds these after email confirmation or OAuth)
                const hashParams = new URLSearchParams(location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');

                // If we have tokens in the URL, set the session
                if (accessToken && refreshToken) {
                    const { data: { session }, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (error) throw error;

                    if (session) {
                        // Check if this was an email confirmation (signup type)
                        if (type === 'signup' || type === 'email') {
                            // Email was just confirmed - show success page
                            navigate('/verify-email', { state: { verified: true } });
                            return;
                        }

                        // Normal OAuth or already confirmed - go to dashboard
                        setUser({
                            id: session.user.id,
                            email: session.user.email!,
                            name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
                            avatarUrl: session.user.user_metadata.avatar_url,
                            currency: 'USD',
                            createdAt: new Date().toISOString()
                        });
                        navigate('/dashboard');
                        return;
                    }
                }

                // Fallback: check for existing session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (session) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
                        avatarUrl: session.user.user_metadata.avatar_url,
                        currency: 'USD',
                        createdAt: new Date().toISOString()
                    });
                    navigate('/dashboard');
                } else {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Auth Callback Error:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        handleAuthCallback();
    }, [navigate, setUser, setLoading, location]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Spinner size={40} color="#2563eb" />
        </div>
    );
};

// Background AI Insights Fetcher
import { fetchAiTipInBackground } from './services/aiTipCacheService';
import { supabaseTransactionService } from './services/supabaseTransactionService';

function App() {
    const { isAuthenticated, isLoading } = useAuth();
    const { user } = useAuthStore();

    // Track if Zustand has hydrated from localStorage
    const [hasHydrated, setHasHydrated] = React.useState(false);

    // Wait for Zustand to hydrate persisted state
    React.useEffect(() => {
        // Zustand's persist middleware fires this after hydration
        const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
            setHasHydrated(true);
        });

        // If already hydrated (e.g., on hot reload), mark as hydrated
        if (useAuthStore.persist.hasHydrated()) {
            setHasHydrated(true);
        }

        return unsubscribe;
    }, []);

    // Auto-fetch AI insights when user is authenticated
    useEffect(() => {
        const prefetchAiInsights = async () => {
            if (!isAuthenticated || !user?.id) return;

            try {
                console.log('🧠 Pre-fetching AI insights in background...');
                const transactions = await supabaseTransactionService.getAll(user.id);

                if (transactions.length > 0) {
                    // Calculate spending data
                    const expenses = transactions.filter(t => t.type === 'expense');
                    const monthlyTotal = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                    const categoryTotals: Record<string, number> = {};
                    expenses.forEach(t => {
                        const cat = t.category || 'Other';
                        categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount);
                    });
                    const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

                    // Trigger background AI fetch
                    fetchAiTipInBackground(user.id, {
                        monthlyTotal,
                        topCategory: topCat?.[0] || 'Various',
                        categoryAmount: topCat?.[1] || 0
                    });
                }
            } catch (error) {
                console.log('Background AI prefetch failed:', error);
            }
        };

        // Delay slightly to not block initial render
        const timeout = setTimeout(prefetchAiInsights, 2000);
        return () => clearTimeout(timeout);
    }, [isAuthenticated, user?.id]);

    // Wait for BOTH hydration AND session check to complete
    if (!hasHydrated || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Spinner size={40} color="#2563eb" />
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <OfflineIndicator />
                <Toaster
                    position="top-right"
                    richColors
                    duration={4000}
                    closeButton
                    toastOptions={{
                        style: {
                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                            border: 'none',
                            borderRadius: '16px',
                            color: 'white',
                            fontWeight: 600,
                            boxShadow: '0 10px 40px rgba(37, 99, 235, 0.3)'
                        }
                    }}
                />
                <Suspense fallback={
                    <div className="flex-1 overflow-auto">
                        <DashboardSkeleton />
                    </div>
                }>
                    <Routes>
                        {/* Auth Routes */}
                        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
                        <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/dashboard" />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                        <Route path="/auth/callback" element={<AuthCallback />} />

                        {/* Protected Dashboard Routes - Extension Required */}
                        <Route
                            element={
                                isAuthenticated ? (
                                    <ExtensionGate>
                                        <DashboardLayout />
                                    </ExtensionGate>
                                ) : (
                                    <Navigate to="/login" />
                                )
                            }
                        >
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/transactions" element={<TransactionsPage />} />
                            <Route path="/analytics" element={<AnalyticsPage />} />
                            <Route path="/cards" element={<CardsPage />} />
                            <Route path="/expenses" element={<ExpenseDetailsPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            {/* New Feature Routes */}
                            <Route path="/budgets" element={<BudgetsPage />} />
                            <Route path="/bills" element={<BillsPage />} />
                            <Route path="/subscriptions" element={<SubscriptionsPage />} />
                            <Route path="/goals" element={<GoalsPage />} />
                            <Route path="/insights" element={<InsightsPage />} />
                            <Route path="/reports" element={<ReportsPage />} />
                            <Route path="/recurring" element={<RecurringPage />} />
                            <Route path="/accounts" element={<AccountsPage />} />
                            <Route path="/money-twin" element={<MoneyTwinPage />} />
                            <Route path="/ai-test" element={<AITestPage />} />
                            <Route path="/shopping-activity" element={<ShoppingActivityPage />} />
                            <Route path="/reminders" element={<BillRemindersPage />} />
                        </Route>

                        {/* Landing Page for non-authenticated users */}
                        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />

                        {/* Public Legal & Support Pages */}
                        <Route path="/privacy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms" element={<TermsOfServicePage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/features" element={<FeaturesPage />} />

                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Suspense>

            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
