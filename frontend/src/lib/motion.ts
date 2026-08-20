/**
 * Motion preferences + lightweight CSS-driven animation helpers.
 * Replaces heavy framer-motion `repeat: Infinity` loops with GPU-friendly CSS keyframes.
 */

import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const getInitial = (): boolean => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
};

/**
 * Subscribe to the user's reduced-motion preference.
 * SSR-safe: defaults to `false` on the server.
 */
export const usePrefersReducedMotion = (): boolean => {
    const [reduced, setReduced] = useState<boolean>(getInitial);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mql = window.matchMedia(QUERY);
        const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
        // Older Safari uses `addListener`
        if (mql.addEventListener) {
            mql.addEventListener('change', onChange);
        } else {
            mql.addListener(onChange);
        }
        return () => {
            if (mql.removeEventListener) {
                mql.removeEventListener('change', onChange);
            } else {
                mql.removeListener(onChange);
            }
        };
    }, []);

    return reduced;
};

/**
 * Class name that triggers a CSS keyframe animation only when motion is allowed.
 * Use `data-anim="pulse"` etc. on the element to pick the keyframe.
 *
 * Example:
 *   <div data-anim={reduceMotion ? undefined : 'pulse'} className={cx(animClass, '...')} />
 */
export const cssAnimClass = 'cf-anim';
