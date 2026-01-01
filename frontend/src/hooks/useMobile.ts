// useMobile - Mobile Detection and Touch Capability Hook
import { useState, useEffect, useCallback } from 'react';

interface MobileState {
    isMobile: boolean;
    isTablet: boolean;
    isTouchDevice: boolean;
    isLandscape: boolean;
    isStandalone: boolean; // PWA mode
    screenWidth: number;
    screenHeight: number;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/**
 * Hook for detecting mobile devices and touch capability
 * Provides reactive state for responsive behavior
 */
export const useMobile = (): MobileState => {
    const [state, setState] = useState<MobileState>(() => ({
        isMobile: typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
        isTablet: typeof window !== 'undefined' ? window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT : false,
        isTouchDevice: typeof window !== 'undefined' ? 'ontouchstart' in window || navigator.maxTouchPoints > 0 : false,
        isLandscape: typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
        isStandalone: typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)').matches : false,
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
        screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    }));

    const updateState = useCallback(() => {
        setState({
            isMobile: window.innerWidth < MOBILE_BREAKPOINT,
            isTablet: window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT,
            isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            isLandscape: window.innerWidth > window.innerHeight,
            isStandalone: window.matchMedia('(display-mode: standalone)').matches,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
        });
    }, []);

    useEffect(() => {
        // Update on resize
        window.addEventListener('resize', updateState);

        // Update on orientation change
        window.addEventListener('orientationchange', updateState);

        // Initial update
        updateState();

        return () => {
            window.removeEventListener('resize', updateState);
            window.removeEventListener('orientationchange', updateState);
        };
    }, [updateState]);

    return state;
};

/**
 * Simple hook to check if device is mobile (for quick checks)
 */
export const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
    );

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

/**
 * Hook for haptic feedback (if supported)
 */
export const useHapticFeedback = () => {
    const vibrate = useCallback((pattern: number | number[] = 10) => {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }, []);

    const lightTap = useCallback(() => vibrate(5), [vibrate]);
    const mediumTap = useCallback(() => vibrate(10), [vibrate]);
    const heavyTap = useCallback(() => vibrate([10, 30, 10]), [vibrate]);
    const error = useCallback(() => vibrate([50, 50, 50]), [vibrate]);
    const success = useCallback(() => vibrate([10, 50, 10]), [vibrate]);

    return { vibrate, lightTap, mediumTap, heavyTap, error, success };
};

export default useMobile;
