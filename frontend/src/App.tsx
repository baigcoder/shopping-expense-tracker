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
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CardsPage from './pages/CardsPage';
import ExpenseDetailsPage from './pages/ExpenseDetailsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
// New Feature Pages
import BudgetsPage from './pages/BudgetsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import GoalsPage from './pages/GoalsPage';
import InsightsPage from './pages/InsightsPage';
import ReportsPage from './pages/ReportsPage';
import RecurringPage from './pages/RecurringPage';
import AccountsPage from './pages/AccountsPage';
import LandingPage from './pages/LandingPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css'; // Custom Gen-Z toast styles


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

function App() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <ErrorBoundary>
            <BrowserRouter>
                <OfflineIndicator />
                <ToastContainer position="top-right" theme="colored" autoClose={3000} />
                <Routes>
                    {/* Auth Routes */}
                    <Route element={<AuthLayout />}>
                        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
                        <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/dashboard" />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                    </Route>

                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Protected Dashboard Routes */}
                    <Route
                        element={
                            isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />
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
                        <Route path="/subscriptions" element={<SubscriptionsPage />} />
                        <Route path="/goals" element={<GoalsPage />} />
                        <Route path="/insights" element={<InsightsPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/recurring" element={<RecurringPage />} />
                        <Route path="/accounts" element={<AccountsPage />} />
                    </Route>

                    {/* Landing Page for non-authenticated users */}
                    <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
