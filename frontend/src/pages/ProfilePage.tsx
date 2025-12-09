// Profile Page - Gen Z Edition with Fixed Avatar
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Camera, Edit2, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { supabase } from '../config/supabase';
import { toast } from 'react-toastify';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
    const { user, setUser } = useAuthStore();
    const [name, setName] = useState(user?.name || 'Cool Kid');
    const [email, setEmail] = useState(user?.email || 'email@vibes.com');
    const [isEditing, setIsEditing] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarLoaded, setAvatarLoaded] = useState(false);

    // Fetch the avatar URL from Supabase Auth user metadata
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (authUser) {
                    console.log('Auth User Metadata:', authUser.user_metadata);
                    console.log('Identities:', authUser.identities);

                    // Try multiple sources for avatar
                    let avatar = null;

                    // 1. Direct metadata
                    avatar = authUser.user_metadata?.avatar_url ||
                        authUser.user_metadata?.picture ||
                        authUser.user_metadata?.photo;

                    // 2. From Google identity
                    if (!avatar && authUser.identities) {
                        const googleIdentity = authUser.identities.find(
                            id => id.provider === 'google'
                        );
                        if (googleIdentity?.identity_data) {
                            avatar = googleIdentity.identity_data.avatar_url ||
                                googleIdentity.identity_data.picture;
                        }
                    }

                    console.log('Found Avatar URL:', avatar);

                    if (avatar) {
                        setAvatarUrl(avatar);
                    }

                    // Update name from auth
                    const userName = authUser.user_metadata?.full_name ||
                        authUser.user_metadata?.name ||
                        authUser.email?.split('@')[0];
                    if (userName) {
                        setName(userName);
                    }

                    setEmail(authUser.email || '');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const handleSave = () => {
        setIsEditing(false);
        toast.success("Profile updated! ✨");
    };

    // Generate initials for fallback avatar
    const getInitials = () => {
        if (!name) return '👤';
        const words = name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

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
                                onError={(e) => {
                                    console.error('Avatar failed to load:', avatarUrl);
                                    setAvatarUrl(null);
                                }}
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

                {/* Stats / Sidebar */}
                <motion.div
                    className={styles.statsSection}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>Member</span>
                        <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} /> Since 2024
                        </div>
                    </div>

                    <div className={styles.statCard} style={{ boxShadow: '4px 4px 0px #4ECDC4' }}>
                        <span className={styles.statValue}>PRO</span>
                        <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={16} /> Status
                        </div>
                    </div>

                    <div className={styles.statCard} style={{ boxShadow: '4px 4px 0px #FFE66D' }}>
                        <span className={styles.statValue}>$420</span>
                        <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DollarSign size={16} /> Saved
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;
