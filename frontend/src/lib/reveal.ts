import { useEffect } from 'react';

/**
 * Staggered entrance for [data-reveal] children of each [data-reveal-group] as it enters the viewport.
 * The hidden start state lives in CSS under html.reveal-ready + prefers-reduced-motion: no-preference,
 * so content is visible without JS and for anyone who asked for less motion.
 */
export function useReveal() {
    useEffect(() => {
        const root = document.documentElement;
        if (!('IntersectionObserver' in window)) return;
        root.classList.add('reveal-ready');
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) {
                if (!e.isIntersecting) continue;
                e.target.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
                    el.style.transitionDelay = `${i * 80}ms`;
                    el.classList.add('is-in');
                });
                io.unobserve(e.target);
            }
        }, { threshold: 0.15 });
        document.querySelectorAll('[data-reveal-group]').forEach((g) => io.observe(g));
        return () => { io.disconnect(); root.classList.remove('reveal-ready'); };
    }, []);
}
