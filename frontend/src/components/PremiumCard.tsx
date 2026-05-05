import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { Card, CardBrand } from '../store/useStore';
import { getThemeById, getBrandGradient } from '../services/cardService';
import { cn } from '@/lib/utils';
import styles from './PremiumCard.module.css';

// Card Brand Logos (SVG Components)
const VisaLogo = () => (
    <svg viewBox="0 0 80 26" className="h-6 w-auto">
        <text x="0" y="22" fill="#000" fontSize="22" fontWeight="800" fontFamily="Arial, sans-serif" fontStyle="italic">VISA</text>
    </svg>
);

const MastercardLogo = () => (
    <svg viewBox="0 0 60 40" className="h-7 w-auto">
        <circle cx="20" cy="20" r="18" fill="#000" />
        <circle cx="40" cy="20" r="18" fill="#E11D48" />
    </svg>
);

const AmexLogo = () => (
    <svg viewBox="0 0 80 26" className="h-6 w-auto">
        <rect width="80" height="26" fill="#000" />
        <text x="8" y="18" fill="#fff" fontSize="14" fontWeight="900" fontFamily="Arial, sans-serif">AMEX</text>
    </svg>
);

const GenericLogo = () => (
    <svg viewBox="0 0 60 26" className="h-6 w-auto">
        <text x="0" y="20" fill="#000" fontSize="16" fontWeight="700" fontFamily="Arial, sans-serif">BANK</text>
    </svg>
);

const getBrandLogo = (brand: CardBrand) => {
    switch (brand) {
        case 'visa': return <VisaLogo />;
        case 'mastercard': return <MastercardLogo />;
        case 'amex': return <AmexLogo />;
        default: return <GenericLogo />;
    }
};

const getCardGradient = (card: Card): string => {
    if (card.theme) {
        const theme = getThemeById(card.theme);
        return theme.gradient;
    }
    return getBrandGradient(card.type);
};

interface PremiumCardProps {
    card: Card;
    className?: string;
    onClick?: () => void;
    showFullNumber?: boolean;
}

const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
    ({ card, className, onClick, showFullNumber = false }, ref) => {
        return (
            <motion.div
                ref={ref}
                layout
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                className={cn(styles.premiumCard, className)}
                style={{ backgroundColor: '#FFFFFF' }}
            >


                <div className={styles.cardContent}>
                    <div className={styles.cardTop}>
                        <div className={styles.cardLabel}>
                            <div className="flex items-center gap-2 mb-1">
                                <motion.div 
                                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.4, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="w-2 h-2 rounded-full bg-blue-500"
                                />
                                <span className={styles.labelSmall}>Live Asset</span>
                            </div>
                            <span className={styles.labelMain}>Elite Status</span>
                        </div>
                        <div className={styles.brandContainer}>
                            {getBrandLogo(card.type)}
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className={styles.cardChip}>
                            <div className={styles.chipGrid}>
                                {[...Array(9)].map((_, i) => <div key={i} />)}
                            </div>
                        </div>
                        <Smartphone className="h-7 w-7 text-black" strokeWidth={3} />
                    </div>

                    <div className="space-y-4">
                        <div className={styles.cardNumbers}>
                            {showFullNumber
                                ? card.number
                                : (card.number ? card.number.replace(/\d(?=\d{4})/g, "•") : "•••• •••• •••• ••••")
                            }
                        </div>
                        <div className={styles.cardInfo}>
                            <div className={styles.infoBlock}>
                                <span className={styles.infoLabel}>Card Holder</span>
                                <span className={styles.infoText}>{card.holder || 'YOUR NAME'}</span>
                            </div>
                            <div className={styles.infoBlock} style={{ alignItems: 'flex-end' }}>
                                <span className={styles.infoLabel}>Expires</span>
                                <span className={styles.infoText}>{card.expiry || 'MM/YY'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }
);

PremiumCard.displayName = 'PremiumCard';

export default PremiumCard;
