import { useState, useEffect, useCallback } from 'react';
import { soundManager, SoundType } from '@/lib/sounds';

export type LandingCurrency = 'PKR' | 'USD' | 'EUR' | 'GBP' | 'INR';

const RATES_TO_BASE: Record<LandingCurrency, number> = {
    PKR: 1,
    INR: 1,
    USD: 85,
    EUR: 92,
    GBP: 108,
};

const SYMBOLS: Record<LandingCurrency, string> = {
    PKR: 'Rs ',
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
};

export function useLandingSettings() {
    const [currency, setCurrencyState] = useState<LandingCurrency>(() => {
        const saved = localStorage.getItem('cashly_landing_currency');
        // Default to PKR if not set or invalid
        if (saved && (saved === 'PKR' || saved === 'USD' || saved === 'EUR' || saved === 'GBP' || saved === 'INR')) {
            return saved as LandingCurrency;
        }
        return 'PKR';
    });

    const [acoustic, setAcousticState] = useState<boolean>(() => {
        const saved = localStorage.getItem('cashly_landing_acoustic');
        return saved === null ? true : saved === 'true';
    });

    useEffect(() => {
        const handleCurrency = (e: CustomEvent) => {
            if (e.detail?.currency) setCurrencyState(e.detail.currency);
        };
        const handleAcoustic = (e: CustomEvent) => {
            if (typeof e.detail?.acoustic === 'boolean') setAcousticState(e.detail.acoustic);
        };

        window.addEventListener('cashly-landing-currency' as any, handleCurrency as EventListener);
        window.addEventListener('cashly-landing-acoustic' as any, handleAcoustic as EventListener);

        return () => {
            window.removeEventListener('cashly-landing-currency' as any, handleCurrency as EventListener);
            window.removeEventListener('cashly-landing-acoustic' as any, handleAcoustic as EventListener);
        };
    }, []);

    const setCurrency = useCallback((newCur: LandingCurrency) => {
        setCurrencyState(newCur);
        localStorage.setItem('cashly_landing_currency', newCur);
        window.dispatchEvent(new CustomEvent('cashly-landing-currency', { detail: { currency: newCur } }));
        if (acoustic) soundManager.play('click');
    }, [acoustic]);

    const setAcoustic = useCallback((newVal: boolean) => {
        setAcousticState(newVal);
        localStorage.setItem('cashly_landing_acoustic', String(newVal));
        window.dispatchEvent(new CustomEvent('cashly-landing-acoustic', { detail: { acoustic: newVal } }));
        if (newVal) soundManager.play('success');
    }, []);

    const playSound = useCallback((sound: SoundType) => {
        if (acoustic) {
            soundManager.play(sound);
        }
    }, [acoustic]);

    // Format an amount (base PKR/INR) into the selected currency
    const formatAmount = useCallback((baseAmount: number): string => {
        const rate = RATES_TO_BASE[currency] || 1;
        const sym = SYMBOLS[currency] || 'Rs ';
        const converted = Math.round(baseAmount / rate);
        return `${sym}${converted.toLocaleString()}`;
    }, [currency]);

    return {
        currency,
        setCurrency,
        acoustic,
        setAcoustic,
        playSound,
        formatAmount,
        currencySymbol: SYMBOLS[currency],
    };
}
