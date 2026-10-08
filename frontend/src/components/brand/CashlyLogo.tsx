import React from 'react';

interface CashlyLogoProps {
    /** Size of the logo icon in pixels (default: 36) */
    size?: number;
    /** Whether to show the text wordmark alongside the mark (default: false) */
    showWordmark?: boolean;
    /** Wordmark font size relative to icon (default: true) */
    wordmarkClassName?: string;
    /** Optional secondary badge or subtitle like 'OS' or 'Financial OS' */
    subtitle?: string;
    /** Visual style variant of the icon */
    variant?: 'orange' | 'dark' | 'white' | 'minimal';
    /** Interactive hover animation */
    animated?: boolean;
    /** Additional CSS classes for the container */
    className?: string;
}

/**
 * Cashly Sovereign Mark — Pure Vector Emblem
 * Represents:
 * 1. The bold 'C' monogram for Cashly
 * 2. An architectural forward-curving financial trajectory (Money Twin)
 * 3. The sovereign review checkpoint aperture at the core
 */
export const CashlyMark: React.FC<{
    size?: number;
    variant?: 'orange' | 'dark' | 'white' | 'minimal';
    className?: string;
}> = ({ size = 36, variant = 'orange', className = '' }) => {
    // Unique ID prefix to avoid SVG gradient collisions
    const id = React.useId().replace(/:/g, '');

    // Variant color mappings
    const getVariantStyles = () => {
        switch (variant) {
            case 'dark':
                return {
                    bgGradientStart: '#1A1A1E',
                    bgGradientEnd: '#0D0D10',
                    markColor: '#EE5024',
                    accentColor: '#FFFFFF',
                    shadow: 'rgba(0, 0, 0, 0.4)',
                    border: 'rgba(255, 255, 255, 0.1)',
                };
            case 'white':
                return {
                    bgGradientStart: '#FFFFFF',
                    bgGradientEnd: '#F4F3EE',
                    markColor: '#111111',
                    accentColor: '#EE5024',
                    shadow: 'rgba(0, 0, 0, 0.08)',
                    border: 'rgba(0, 0, 0, 0.08)',
                };
            case 'minimal':
                return {
                    bgGradientStart: 'transparent',
                    bgGradientEnd: 'transparent',
                    markColor: 'currentColor',
                    accentColor: '#EE5024',
                    shadow: 'none',
                    border: 'transparent',
                };
            case 'orange':
            default:
                return {
                    bgGradientStart: '#FF5E33',
                    bgGradientEnd: '#E44114',
                    markColor: '#FFFFFF',
                    accentColor: '#FFE7DF',
                    shadow: 'rgba(238, 80, 36, 0.35)',
                    border: 'rgba(255, 255, 255, 0.22)',
                };
        }
    };

    const colors = getVariantStyles();
    const isTransparent = variant === 'minimal';

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`shrink-0 transition-transform duration-200 ${className}`}
            style={{
                filter: isTransparent ? 'none' : `drop-shadow(0 4px 12px ${colors.shadow})`,
            }}
            aria-label="Cashly Logo Mark"
        >
            <defs>
                {/* Background Squircle Gradient */}
                <linearGradient id={`cashlyBg_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colors.bgGradientStart} />
                    <stop offset="100%" stopColor={colors.bgGradientEnd} />
                </linearGradient>

                {/* Mark Metallic / Inner Glow Gradient */}
                <linearGradient id={`cashlyMarkGrad_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colors.markColor} />
                    <stop offset="100%" stopColor={colors.accentColor} stopOpacity="0.92" />
                </linearGradient>

                {/* Dynamic Forward Trajectory Arc Gradient */}
                <linearGradient id={`cashlyTrajectory_${id}`} x1="20%" y1="80%" x2="80%" y2="20%">
                    <stop offset="0%" stopColor={colors.markColor} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={colors.accentColor} />
                </linearGradient>
            </defs>

            {!isTransparent && (
                <>
                    {/* Architectural Precision Squircle Tile */}
                    <rect
                        x="1.5"
                        y="1.5"
                        width="61"
                        height="61"
                        rx="16"
                        fill={`url(#cashlyBg_${id})`}
                        stroke={colors.border}
                        strokeWidth="1.5"
                    />

                    {/* Subtle Top Glass Rim Highlight */}
                    <path
                        d="M 5 20 C 5 11 11 5 20 5 L 44 5 C 53 5 59 11 59 20"
                        stroke="rgba(255, 255, 255, 0.28)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        fill="none"
                    />
                </>
            )}

            {/* 
              Cashly Monogram Geometry:
              1. Bold sweeping outer 'C' curve with precise tapered terminals
              2. Internal forward trajectory blade (forward runway momentum)
              3. The sovereign review node (central precision compass dot)
            */}
            <g transform="translate(32, 32)">
                {/* Outer 'C' Monogram Arc */}
                <path
                    d="M 14 -13
                       C 8.5 -19.5, -4 -21.5, -12.5 -16
                       C -22 -9.5, -23.5 5, -16 14.5
                       C -8.5 23.5, 4.5 23, 13.5 15.5
                       C 14.8 14.3, 15.8 12.8, 16 11
                       L 9.5 9
                       C 9 10.5, 8 11.5, 7 12.5
                       C 1.5 17.5, -7.5 17, -12 11
                       C -16.5 4.5, -15 -6, -9 -11
                       C -3.5 -15.5, 5 -14.5, 9.5 -9.5
                       Z"
                    fill={`url(#cashlyMarkGrad_${id})`}
                />

                {/* Forward Financial Runway Trajectory Line & Terminal Apex */}
                <path
                    d="M -5 1 L 15 1 C 18 1, 20.5 -1.5, 20.5 -4.5 C 20.5 -7.5, 18 -10, 15 -10 L 9 -10"
                    stroke={`url(#cashlyTrajectory_${id})`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* The Sovereign Consent Core Checkpoint / Compass Diamond Node */}
                <circle
                    cx="0"
                    cy="1"
                    r="3.2"
                    fill={colors.accentColor}
                />
            </g>
        </svg>
    );
};

/**
 * Full Cashly Brand Logo component with responsive typographic hierarchy
 */
export const CashlyLogo: React.FC<CashlyLogoProps> = ({
    size = 38,
    showWordmark = false,
    wordmarkClassName = '',
    subtitle,
    variant = 'orange',
    animated = true,
    className = '',
}) => {
    return (
        <div
            className={`inline-flex items-center gap-3 select-none ${animated ? 'group cursor-pointer' : ''} ${className}`}
        >
            <div className={`shrink-0 ${animated ? 'transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[-1deg]' : ''}`}>
                <CashlyMark size={size} variant={variant} />
            </div>

            {showWordmark && (
                <div className="flex flex-col justify-center leading-none">
                    <div className="flex items-center gap-1.5">
                        <span
                            className={`font-display font-extrabold tracking-tight text-neutral-900 dark:text-white ${wordmarkClassName}`}
                            style={{
                                fontSize: `${Math.round(size * 0.58)}px`,
                                letterSpacing: '-0.035em',
                            }}
                        >
                            Cashly
                        </span>
                        {subtitle && (
                            <span className="ml-1 inline-block rounded-full bg-[var(--landing-orange,#EE5024)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--landing-orange,#EE5024)] dark:bg-white/10 dark:text-neutral-300">
                                {subtitle}
                            </span>
                        )}
                    </div>
                    {!subtitle && (
                        <span className="text-[10px] font-medium tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Financial Operating System
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default CashlyLogo;
