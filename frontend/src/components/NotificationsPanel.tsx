// Notifications Panel - Dynamic Real-Time Notifications with Gen-Z Design
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Trash2, Sparkles } from 'lucide-react';
import {
    useNotificationStore,
    formatTimeAgo,
    getNotificationIcon,
    getNotificationColor
} from '../services/notificationService';
import styles from './NotificationsPanel.module.css';

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationsPanel = ({ isOpen, onClose }: NotificationsPanelProps) => {
    const {
        notifications,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll
    } = useNotificationStore();

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className={styles.panel}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.headerLeft}>
                                <div className={styles.bellIcon}>
                                    <Bell size={18} />
                                </div>
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className={styles.badge}>{unreadCount}</span>
                                )}
                            </div>
                            <div className={styles.headerActions}>
                                {unreadCount > 0 && (
                                    <button
                                        className={styles.markAllBtn}
                                        onClick={markAllAsRead}
                                        title="Mark all as read"
                                    >
                                        <CheckCheck size={14} />
                                        <span>Mark all read</span>
                                    </button>
                                )}
                                <button className={styles.closeBtn} onClick={onClose}>
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className={styles.list}>
                            {notifications.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <Sparkles size={40} className={styles.emptyIcon} />
                                    <h4>All caught up!</h4>
                                    <p>No notifications yet. We'll let you know when something happens.</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {notifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            className={`${styles.item} ${!notification.read ? styles.unread : ''}`}
                                            onClick={() => markAsRead(notification.id)}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20, height: 0 }}
                                            layout
                                        >
                                            <div
                                                className={styles.itemIcon}
                                                style={{
                                                    background: `${getNotificationColor(notification.type)}15`,
                                                    borderColor: getNotificationColor(notification.type)
                                                }}
                                            >
                                                <span>{getNotificationIcon(notification.type)}</span>
                                            </div>
                                            <div className={styles.itemContent}>
                                                <h4>{notification.title}</h4>
                                                <p>{notification.message}</p>
                                                <span className={styles.time}>
                                                    {formatTimeAgo(notification.createdAt)}
                                                </span>
                                            </div>
                                            <div className={styles.itemActions}>
                                                {!notification.read && (
                                                    <div className={styles.unreadDot} />
                                                )}
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        clearNotification(notification.id);
                                                    }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className={styles.footer}>
                                <button className={styles.clearAllBtn} onClick={clearAll}>
                                    Clear All
                                </button>
                                <span className={styles.footerText}>
                                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationsPanel;
