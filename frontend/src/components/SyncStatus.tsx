// Sync Status Indicator - Shows realtime connection status
import { memo } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface SyncStatusProps {
    status: 'connected' | 'connecting' | 'disconnected';
    onReconnect?: () => void;
}

const SyncStatus = memo(({ status, onReconnect }: SyncStatusProps) => {
    const statusConfig = {
        connected: {
            icon: <Wifi size={14} />,
            color: '#10B981',
            bg: 'rgba(16, 185, 129, 0.1)',
            text: 'Live',
            pulse: true
        },
        connecting: {
            icon: <RefreshCw size={14} className="animate-spin" />,
            color: '#F59E0B',
            bg: 'rgba(245, 158, 11, 0.1)',
            text: 'Syncing',
            pulse: false
        },
        disconnected: {
            icon: <WifiOff size={14} />,
            color: '#EF4444',
            bg: 'rgba(239, 68, 68, 0.1)',
            text: 'Offline',
            pulse: false
        }
    };

    const config = statusConfig[status];

    return (
        <button
            onClick={status === 'disconnected' ? onReconnect : undefined}
            title={status === 'disconnected' ? 'Click to reconnect' : `Sync status: ${config.text}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: config.bg,
                border: `1px solid ${config.color}30`,
                color: config.color,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: status === 'disconnected' ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                position: 'relative'
            }}
        >
            {/* Pulse animation for connected state */}
            {config.pulse && (
                <span
                    style={{
                        position: 'absolute',
                        left: 6,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: config.color,
                        animation: 'pulse 2s infinite'
                    }}
                />
            )}
            <span style={{ marginLeft: config.pulse ? '10px' : 0 }}>
                {config.icon}
            </span>
            <span>{config.text}</span>
        </button>
    );
});

SyncStatus.displayName = 'SyncStatus';

export default SyncStatus;

// Add this CSS to your global styles or module:
// @keyframes pulse {
//   0%, 100% { opacity: 1; transform: scale(1); }
//   50% { opacity: 0.5; transform: scale(1.2); }
// }
