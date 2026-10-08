// Main App with Routing
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/useStore';
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
import { CashlyLoader } from './components/brand/CashlyLoader';
import ErrorBoundary from './components/ErrorBoundary';
const OfflineIndicator = lazy(() => import('./components/OfflineIndicator'));
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
const DemoOSPage = lazy(() => import('./pages/DemoOSPage'));

// Legal & Support Pages
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));





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
                <Suspense fallback={null}>
                    <OfflineIndicator />
                </Suspense>
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
