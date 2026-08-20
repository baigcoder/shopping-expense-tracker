// Main App with Routing
import React, { useEffect, lazy, Suspense, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/useStore';
import { supabase } from './config/supabase';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { Spinner } from './components/LoadingSkeleton';
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
const TransactionInboxPage = lazy(() => import('./pages/TransactionInboxPage'));
const CashflowCalendarPage = lazy(() => import('./pages/CashflowCalendarPage'));
const ExtensionHealthPage = lazy(() => import('./pages/ExtensionHealthPage'));
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
    const handledRef = useRef(false);

    useEffect(() => {
        if (handledRef.current) return;
        handledRef.current = true;

        const hydrateFromSession = (session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>) => {
            setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
                avatarUrl: session.user.user_metadata.avatar_url,
                currency: 'USD',
                createdAt: new Date().toISOString(),
            });
        };

        const handleAuthCallback = async () => {
            try {
                const hashParams = new URLSearchParams(location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');
                const searchParams = new URLSearchParams(location.search);
                const code = searchParams.get('code');
                const next = searchParams.get('next');

                const oauthError =
                    searchParams.get('error_description')
                    || searchParams.get('error')
                    || hashParams.get('error_description')
                    || hashParams.get('error');

                if (oauthError) {
                    throw new Error(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
                }

                const navigateAfterAuth = (fallback = '/dashboard') => {
                    const target = next && next.startsWith('/') && !next.startsWith('//')
                        ? next
                        : fallback;
                    navigate(target, { replace: true });
                };

                // PKCE OAuth — exchange once (React StrictMode safe: reuse existing session)
                if (code) {
                    const { data: { session: existingSession } } = await supabase.auth.getSession();
                    if (existingSession?.user) {
                        hydrateFromSession(existingSession);
                        navigateAfterAuth();
                        return;
                    }

                    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;

                    if (session?.user) {
                        hydrateFromSession(session);
                        navigateAfterAuth();
                        return;
                    }
                }

                // Hash tokens (email confirmation / legacy implicit OAuth)
                if (accessToken && refreshToken) {
                    const { data: { session }, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) throw error;

                    if (session) {
                        if (type === 'signup' || type === 'email') {
                            navigate('/verify-email', { state: { verified: true }, replace: true });
                            return;
                        }

                        hydrateFromSession(session);
                        navigateAfterAuth();
                        return;
                    }
                }

                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (session) {
                    hydrateFromSession(session);
                    navigateAfterAuth();
                } else {
                    navigate('/login', {
                        replace: true,
                        state: { authError: 'Google sign-in did not complete. Try again or use email login.' },
                    });
                }
            } catch (error) {
                console.error('Auth Callback Error:', error);
                const message = error instanceof Error ? error.message : 'Google sign-in failed';
                navigate('/login', { replace: true, state: { authError: message } });
            } finally {
                setLoading(false);
            }
        };

        handleAuthCallback();
    }, [navigate, setUser, setLoading, location]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Spinner size={40} color="#E11D48" />
        </div>
    );
};

function App() {
    const { isAuthenticated, isLoading } = useAuth();

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


    // Wait for BOTH hydration AND session check to complete
    if (!hasHydrated || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Spinner size={40} color="#E11D48" />
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <OfflineIndicator />
                <Toaster
                    position="top-right"
                    duration={4000}
                    closeButton
                    toastOptions={{
                        style: {
                            background: '#FFFFFF',
                            border: '3px solid #09090B',
                            borderRadius: '0',
                            color: '#09090B',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontSize: '0.8rem',
                            boxShadow: '6px 6px 0 #E11D48'
                        }
                    }}
                />
                <Suspense fallback={
                    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                        <div className="w-14 h-14 bg-[#09090B] border-[3px] border-black flex items-center justify-center text-white font-black text-2xl shadow-[6px_6px_0_#E11D48] mb-6 animate-pulse">
                            C
                        </div>
                        <Spinner size={32} color="#E11D48" />
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
                            <Route path="/transaction-inbox" element={<TransactionInboxPage />} />
                            <Route path="/analytics" element={<AnalyticsPage />} />
                            <Route path="/cards" element={<CardsPage />} />
                            <Route path="/expenses" element={<ExpenseDetailsPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/setting" element={<Navigate to="/settings" replace />} />
                            {/* New Feature Routes */}
                            <Route path="/budgets" element={<BudgetsPage />} />
                            <Route path="/bills" element={<BillsPage />} />
                            <Route path="/subscriptions" element={<SubscriptionsPage />} />
                            <Route path="/goals" element={<GoalsPage />} />
                            <Route path="/insights" element={<InsightsPage />} />
                            <Route path="/reports" element={<ReportsPage />} />
                            <Route path="/cashflow-calendar" element={<CashflowCalendarPage />} />
                            <Route path="/extension-health" element={<ExtensionHealthPage />} />
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
