// Profile Page - Gen Z Edition with Dynamic Stats
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Camera, Edit2, CheckCircle, Calendar, TrendingUp, Wallet, Target, ShoppingBag, Zap } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { supabase } from '../config/supabase';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { goalService, Goal } from '../services/goalService';
import { formatCurrency } from '../services/currencyService';
import genZToast from '../services/genZToast';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
    const { user, setUser } = useAuthStore();
    const [name, setName] = useState(user?.name || 'Cool Kid');
    const [email, setEmail] = useState(user?.email || 'email@vibes.com');
    const [isEditing, setIsEditing] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarLoaded, setAvatarLoaded] = useState(false);
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch user data and stats
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (authUser) {
                    // Try multiple sources for avatar
                    let avatar = authUser.user_metadata?.avatar_url ||
                        authUser.user_metadata?.picture ||
                        authUser.user_metadata?.photo;

                    // From Google identity
                    if (!avatar && authUser.identities) {
                        const googleIdentity = authUser.identities.find(id => id.provider === 'google');
                        if (googleIdentity?.identity_data) {
                            avatar = googleIdentity.identity_data.avatar_url || googleIdentity.identity_data.picture;
                        }
                    }

                    if (avatar) setAvatarUrl(avatar);

                    const userName = authUser.user_metadata?.full_name ||
                        authUser.user_metadata?.name ||
                        authUser.email?.split('@')[0];
                    if (userName) setName(userName);
                    setEmail(authUser.email || '');

                    // Fetch transactions and goals for stats
                    const [txData, goalData] = await Promise.all([
                        supabaseTransactionService.getAll(authUser.id),
                        goalService.getAll(authUser.id)
                    ]);
                    setTransactions(txData);
                    setGoals(goalData);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Calculate dynamic stats
    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        const totalTransactions = transactions.length;
        const thisMonthSpent = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
        const activeGoals = goals.filter(g => g.saved < g.target).length;
        const completedGoals = goals.filter(g => g.saved >= g.target).length;

        // Calculate streak (days with at least one transaction)
        const uniqueDays = new Set(transactions.map(t => new Date(t.date).toDateString()));
        const streak = uniqueDays.size;

        // Member since
        const createdAt = user?.createdAt ? new Date(user.createdAt) : new Date();
        const memberSince = createdAt.getFullYear();


        return { totalTransactions, thisMonthSpent, totalSaved, activeGoals, completedGoals, streak, memberSince };
    }, [transactions, goals, user]);

    const handleSave = () => {
        setIsEditing(false);
        genZToast.success("Profile updated! ✨");
    };

    const getInitials = () => {
        if (!name) return '👤';
        const words = name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <motion.div
                        className={styles.loaderCard}
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                    >
                        <span style={{ fontSize: '3rem' }}>👤</span>
                    </motion.div>
                    <p>loading your profile<span className={styles.loadingDots}></span></p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>My Profile 👤</h1>
                <p>This is you. Lookin' good.</p>
            </motion.div>

            <motion.div
                className={styles.profileCard}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
            >
                <div className={styles.avatarWrapper}>
                    <div className={styles.avatar}>
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Profile"
                                className={styles.avatarImage}
                                onLoad={() => setAvatarLoaded(true)}
                                onError={() => setAvatarUrl(null)}
                                style={{ display: avatarLoaded ? 'block' : 'none' }}
                            />
                        ) : null}
                        {(!avatarUrl || !avatarLoaded) && (
                            <span className={styles.avatarInitials}>{getInitials()}</span>
                        )}
                    </div>
                    <button className={styles.editAvatarBtn}>
                        <Camera size={18} />
                    </button>
                </div>

                <h2 className={styles.username}>
                    {name}
                    <span className={styles.verified} title="Verified"><CheckCircle size={24} fill="#10B981" color="#fff" /></span>
                </h2>
                <span className={styles.userhandle}>@{name.toLowerCase().replace(/\s/g, '')}</span>
            </motion.div>

            <div className={styles.grid}>
                {/* Edit Form */}
                <motion.div
                    className={styles.formSection}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={styles.sectionTitle}>
                        <Edit2 size={24} />
                        <span>Public Info</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Display Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled
                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                        />
                    </div>

                    {isEditing ? (
                        <button className={styles.saveBtn} onClick={handleSave}>
                            Save Changes 💾
                        </button>
                    ) : (
                        <button className={styles.saveBtn} onClick={() => setIsEditing(true)}>
                            Edit Profile ✏️
                        </button>
                    )}
                </motion.div>

                {/* Dynamic Stats */}
                <motion.div
                    className={styles.statsSection}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className={styles.statCard}>
                        <div className={styles.statIconBox} style={{ background: '#E0E7FF' }}>
                            <Calendar size={20} color="#3B82F6" />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>Since {stats.memberSince}</span>
                            <span className={styles.statLabel}>Member</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIconBox} style={{ background: '#D1FAE5' }}>
                            <TrendingUp size={20} color="#10B981" />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.totalTransactions}</span>
                            <span className={styles.statLabel}>Transactions</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIconBox} style={{ background: '#FEF3C7' }}>
                            <Target size={20} color="#F59E0B" />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.activeGoals} active</span>
                            <span className={styles.statLabel}>Goals</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIconBox} style={{ background: '#FCE7F3' }}>
                            <Wallet size={20} color="#EC4899" />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{formatCurrency(stats.totalSaved)}</span>
                            <span className={styles.statLabel}>Goals Saved</span>
                        </div>
                    </div>

                    {stats.completedGoals > 0 && (
                        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #10B981, #34D399)', color: '#fff' }}>
                            <div className={styles.statIconBox} style={{ background: 'rgba(255,255,255,0.2)' }}>
                                <Zap size={20} color="#fff" />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue} style={{ color: '#fff' }}>{stats.completedGoals} 🎉</span>
                                <span className={styles.statLabel} style={{ color: 'rgba(255,255,255,0.8)' }}>Goals Crushed</span>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;
