import React from 'react';
import { CashlyMark } from './CashlyLogo';

interface CashlyLoaderProps {
    /** Whether to render as a full-viewport splash loader (default: false) */
    fullscreen?: boolean;
    /** Size of the central emblem (default: 48) */
    size?: number;
    /** Primary status message */
    message?: string;
    /** Secondary contextual subtext */
    subtext?: string;
    /** Visual theme variant */
    variant?: 'cream' | 'dark' | 'transparent';
    /** Custom CSS class */
    className?: string;
}

/**
 * Cashly Calm Finance Loader
 * Seamlessly matches the editorial aesthetic with Cadmium Orange telemetry,
 * forward trajectory pulse line, and serene typography.
 */
export const CashlyLoader: React.FC<CashlyLoaderProps> = ({
    fullscreen = false,
    size = 48,
    message = 'Initializing Financial OS...',
    subtext = 'Grounded in your real transactions',
    variant = 'cream',
    className = '',
}) => {
    const bgStyles = () => {
        switch (variant) {
            case 'dark':
                return 'bg-[#0D0D10] text-white';
            case 'transparent':
                return 'bg-transparent text-neutral-800 dark:text-neutral-200';
            case 'cream':
            default:
                return 'bg-[#F4F3EE] text-[#111111] dark:bg-[#0D0D10] dark:text-white';
        }
    };

    const content = (
        <div className={`flex flex-col items-center justify-center gap-6 p-8 text-center select-none ${className}`}>
            {/* Luminous Pulsing Emblem Frame */}
            <div className="relative flex items-center justify-center">
                {/* Outer Ambient Glow Ring */}
                <div
                    className="absolute rounded-3xl animate-ping opacity-20 pointer-events-none"
                    style={{
                        width: size * 1.5,
                        height: size * 1.5,
                        backgroundColor: '#EE5024',
                        animationDuration: '2.4s',
                    }}
                />

                {/* Rotating Trajectory Halo */}
                <svg
                    className="absolute animate-spin pointer-events-none"
                    style={{
                        width: size * 1.65,
                        height: size * 1.65,
                        animationDuration: '3s',
                    }}
                    viewBox="0 0 100 100"
                >
                    <circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke="rgba(238, 80, 36, 0.15)"
                        strokeWidth="3"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke="#EE5024"
                        strokeWidth="3.5"
                        strokeDasharray="40 180"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Central Cashly Mark */}
                <div className="relative z-10 transition-transform duration-300">
                    <CashlyMark size={size} variant="orange" />
                </div>
            </div>

            {/* Editorial Status Readout */}
            <div className="flex flex-col items-center gap-1.5 max-w-xs">
                <span className="font-display text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    {message}
                </span>

                {subtext && (
                    <span className="text-[11px] font-medium tracking-wide text-neutral-500 dark:text-neutral-400">
                        {subtext}
                    </span>
                )}

                {/* Runway Trajectory Progress Line */}
                <div className="mt-2.5 h-1 w-32 overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-800">
                    <div
                        className="h-full rounded-full bg-[var(--landing-orange,#EE5024)]"
                        style={{
                            width: '40%',
                            animation: 'cashlyRunwayProgress 1.5s ease-in-out infinite alternate',
                        }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes cashlyRunwayProgress {
                    0% {
                        transform: translateX(-40%);
                        width: 30%;
                    }
                    50% {
                        width: 65%;
                    }
                    100% {
                        transform: translateX(180%);
                        width: 35%;
                    }
                }
            `}</style>
        </div>
    );

    if (fullscreen) {
        return (
            <div className={`fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center transition-colors duration-300 ${bgStyles()}`}>
                {content}
            </div>
        );
    }

    return content;
};

export default CashlyLoader;
