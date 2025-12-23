// Main App with Routing
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/useStore';
import { supabase } from './config/supabase';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CardsPage from './pages/CardsPage';
import ExpenseDetailsPage from './pages/ExpenseDetailsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
// New Feature Pages
import BudgetsPage from './pages/BudgetsPage';
import BillsPage from './pages/BillsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import GoalsPage from './pages/GoalsPage';
import InsightsPage from './pages/InsightsPage';
import ReportsPage from './pages/ReportsPage';
import RecurringPage from './pages/RecurringPage';
import AccountsPage from './pages/AccountsPage';
import MoneyTwinPage from './pages/MoneyTwinPage';
import BillRemindersPage from './pages/BillRemindersPage';
import AITestPage from './pages/AITestPage';
import ShoppingActivityPage from './pages/ShoppingActivityPage';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
// Legal & Support Pages
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
// Extension Integration
import ExtensionGate from './components/ExtensionGate';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css'; // Custom toast styles



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

    return <LoadingScreen />;
};

// Background AI Insights Fetcher
import { fetchAiTipInBackground } from './services/aiTipCacheService';
import { supabaseTransactionService } from './services/supabaseTransactionService';

function App() {
    const { isAuthenticated, isLoading } = useAuth();
    const { user } = useAuthStore();

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

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <ErrorBoundary>
            <BrowserRouter>
                <OfflineIndicator />
                <ToastContainer position="top-right" theme="colored" autoClose={4000} />
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

            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
