// Main App with Routing
import React, { useEffect, lazy, Suspense, useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/useStore';
import { supabase } from './config/supabase';
import DashboardLayout from './layouts/DashboardLayout';
import { Spinner } from './components/LoadingSkeleton';
import { CashlyLoader } from './components/brand/CashlyLoader';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
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
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Feature Pages
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const TransactionInboxPage = lazy(() => import('./pages/TransactionInboxPage'));
const CashflowCalendarPage = lazy(() => import('./pages/CashflowCalendarPage'));
const ExtensionHealthPage = lazy(() => import('./pages/ExtensionHealthPage'));
const MoneyTwinPage = lazy(() => import('./pages/MoneyTwinPage'));
const ShoppingActivityPage = lazy(() => import('./pages/ShoppingActivityPage'));

// Public Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
import DemoOSPage from './pages/DemoOSPage';

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
    const [takingLong, setTakingLong] = useState(false);

    const hydrateFromSession = useCallback((session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>) => {
        setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            avatarUrl: session.user.user_metadata?.avatar_url,
            currency: 'USD',
            createdAt: new Date().toISOString(),
        });
    }, [setUser]);

    useEffect(() => {
        const longTimer = setTimeout(() => {
            setTakingLong(true);
        }, 3500);

        const watchdog = setTimeout(async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    hydrateFromSession(session);
                    navigate('/dashboard', { replace: true });
                    return;
                }
            } catch {
                // Ignore
            }
            navigate('/login', {
                replace: true,
                state: { authError: 'Authentication connection timed out. Please try signing in again.' },
            });
        }, 7000);

        return () => {
            clearTimeout(longTimer);
            clearTimeout(watchdog);
        };
    }, [navigate, hydrateFromSession]);

    useEffect(() => {
        if (handledRef.current) return;
        handledRef.current = true;

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

                    try {
                        const exchangePromise = supabase.auth.exchangeCodeForSession(code);
                        const timeoutPromise = new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('PKCE exchange timeout')), 5500)
                        );

                        const { data: { session }, error } = await Promise.race([exchangePromise, timeoutPromise]);
                        if (error) throw error;

                        if (session?.user) {
                            hydrateFromSession(session);
                            navigateAfterAuth();
                            return;
                        }
                    } catch (codeErr) {
                        // Resilient fallback: Check if session was already established
                        const { data: { session: fallbackSession } } = await supabase.auth.getSession();
                        if (fallbackSession?.user) {
                            hydrateFromSession(fallbackSession);
                            navigateAfterAuth();
                            return;
                        }
                        throw codeErr;
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
    }, [navigate, hydrateFromSession, setLoading, location]);

    return (
        <div className="relative min-h-screen">
            <CashlyLoader fullscreen message="Verifying authentication..." subtext="Connecting to secure session" />
            {takingLong && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white px-5 py-3 rounded-full border border-stone-300 shadow-2xl animate-fade-in">
                    <span className="text-xs text-stone-600 font-medium">Connecting is taking longer than usual...</span>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard', { replace: true })}
                        className="text-xs font-semibold px-3 py-1.5 bg-[#EE5024] text-white rounded-full hover:bg-[#D4431B] transition-colors shadow-sm"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/login', { replace: true })}
                        className="text-xs font-semibold px-2 py-1.5 text-stone-500 hover:text-stone-800 transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            )}
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

        // Hydration safety timeout: never block longer than 1.5s
        const timeout = setTimeout(() => setHasHydrated(true), 1500);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);


    // Wait for BOTH hydration AND session check to complete
    if (!hasHydrated || isLoading) {
        return (
            <CashlyLoader fullscreen message="Initializing Financial OS..." subtext="Grounded in your real transactions" />
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
                            border: '1px solid #E7E5E4',
                            borderRadius: '16px',
                            color: '#1C1917',
                            fontWeight: 500,
                            textTransform: 'none',
                            letterSpacing: '0',
                            fontSize: '0.9rem',
                            boxShadow: '0 1px 2px rgba(28,25,23,0.06), 0 8px 24px rgba(28,25,23,0.06)',
                        }
                    }}
                />
                <Suspense fallback={
                    <CashlyLoader fullscreen message="Loading console..." subtext="Preparing workspace" />
                }>
                    <Routes>
                        {/* Auth Routes */}
                        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
                        <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/dashboard" />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                        <Route path="/auth/callback" element={<AuthCallback />} />

                        {/* Protected Dashboard Routes */}
                        <Route
                            element={
                                isAuthenticated ? (
                                    <DashboardLayout />
                                ) : (
                                    <Navigate to="/login" />
                                )
                            }
                        >
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/transactions" element={<TransactionsPage />} />
                            <Route path="/transaction-inbox" element={<TransactionInboxPage />} />
                            <Route path="/analytics" element={<AnalyticsPage />} />
                            <Route path="/analyze" element={<Navigate to="/analytics" replace />} />
                            <Route path="/cards" element={<CardsPage />} />
                            <Route path="/expenses" element={<Navigate to="/transactions" replace />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/setting" element={<Navigate to="/settings" replace />} />
                            {/* Feature Routes */}
                            <Route path="/plan" element={<Navigate to="/budgets" replace />} />
                            <Route path="/plan/budgets" element={<Navigate to="/budgets" replace />} />
                            <Route path="/plan/commitments" element={<Navigate to="/subscriptions" replace />} />
                            <Route path="/plan/goals" element={<Navigate to="/goals" replace />} />
                            <Route path="/plan/calendar" element={<Navigate to="/cashflow-calendar" replace />} />
                            <Route path="/budgets" element={<BudgetsPage />} />
                            <Route path="/bills" element={<Navigate to="/subscriptions?tab=bills" replace />} />
                            <Route path="/subscriptions" element={<SubscriptionsPage />} />
                            <Route path="/goals" element={<GoalsPage />} />
                            <Route path="/insights" element={<InsightsPage />} />
                            <Route path="/assist" element={<Navigate to="/insights" replace />} />
                            <Route path="/reports" element={<ReportsPage />} />
                            <Route path="/cashflow-calendar" element={<CashflowCalendarPage />} />
                            <Route path="/extension-health" element={<ExtensionHealthPage />} />
                            <Route path="/recurring" element={<Navigate to="/subscriptions" replace />} />
                            <Route path="/accounts" element={<Navigate to="/cards?tab=accounts" replace />} />
                            <Route path="/money-twin" element={<MoneyTwinPage />} />
                            <Route path="/shopping-activity" element={<ShoppingActivityPage />} />
                            <Route path="/reminders" element={<Navigate to="/subscriptions?tab=trials" replace />} />
                        </Route>

                        {/* Landing Page for non-authenticated users */}
                        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />

                        {/* Public Legal & Support Pages */}
                        <Route path="/demo" element={<DemoOSPage />} />
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
