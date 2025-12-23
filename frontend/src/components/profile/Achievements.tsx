import { motion } from 'framer-motion';
import { Award, TrendingUp, DollarSign, Target, Calendar } from 'lucide-react';
import styles from './Achievements.module.css';

interface AchievementsProps {
    stats: {
        totalSaved: number;
        completedGoals: number;
        streak: number;
        memberSince: number;
        totalTransactions: number;
    };
}

const Achievements = ({ stats }: AchievementsProps) => {
    const badges = [
        {
            id: 'newbie',
            name: 'Newbie',
            description: 'Joined the squad',
            icon: <Calendar size={24} />,
            color: '#60A5FA', // Blue
            bg: '#DBEAFE',
            unlocked: true // Everyone gets this
        },
        {
            id: 'saver',
            name: 'Big Saver',
            description: 'Saved over $1,000',
            icon: <DollarSign size={24} />,
            color: '#10B981', // Green
            bg: '#D1FAE5',
            unlocked: stats.totalSaved >= 1000
        },
        {
            id: 'goal-getter',
            name: 'Goal Getter',
            description: 'Completed 1+ goals',
            icon: <Target size={24} />,
            color: '#F59E0B', // Amber
            bg: '#FEF3C7',
            unlocked: stats.completedGoals >= 1
        },
        {
            id: 'streaker',
            name: 'On Fire',
            description: '7+ day streak',
            icon: <TrendingUp size={24} />,
            color: '#EF4444', // Red
            bg: '#FEE2E2',
            unlocked: stats.streak >= 7
        },
        {
            id: 'spender',
            name: 'Power User',
            description: '100+ transactions',
            icon: <Award size={24} />,
            color: '#8B5CF6', // Purple
            bg: '#EDE9FE',
            unlocked: stats.totalTransactions >= 100
        }
    ];

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Badges 🏆</h3>
            <div className={styles.grid}>
                {badges.map((badge, index) => (
                    <motion.div
                        key={badge.id}
                        className={`${styles.badge} ${!badge.unlocked ? styles.locked : ''}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        title={!badge.unlocked ? 'Locked' : badge.description}
                    >
                        <div className={styles.iconBox} style={{
                            background: badge.unlocked ? badge.bg : '#F1F5F9',
                            color: badge.unlocked ? badge.color : '#94A3B8',
                            borderColor: badge.unlocked ? badge.color : 'transparent'
                        }}>
                            {badge.icon}
                        </div>
                        <span className={styles.badgeName}>{badge.name}</span>
                        {badge.unlocked && <span className={styles.badgeDesc}>{badge.description}</span>}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Achievements;
