import { motion } from 'framer-motion';
import { Smartphone, Disc } from 'lucide-react';
import { Card, CardBrand } from '../store/useStore';
import { getThemeById, getBrandGradient } from '../services/cardService';
import { cn } from '@/lib/utils';
import styles from './PremiumCard.module.css';

// Card Brand Logos (SVG Components)
const VisaLogo = () => (
    <svg viewBox="0 0 80 26" className="h-6 w-auto">
        <text x="0" y="22" fill="#fff" fontSize="22" fontWeight="800" fontFamily="Arial, sans-serif" fontStyle="italic">VISA</text>
    </svg>
);

const MastercardLogo = () => (
    <svg viewBox="0 0 60 40" className="h-6 w-auto">
        <circle cx="20" cy="20" r="18" fill="#EB001B" />
        <circle cx="40" cy="20" r="18" fill="#F79E1B" />
        <path d="M30 7a18 18 0 0 0 0 26" fill="#FF5F00" />
    </svg>
);

const AmexLogo = () => (
    <svg viewBox="0 0 80 26" className="h-6 w-auto">
        <rect width="80" height="26" rx="4" fill="rgba(255,255,255,0.2)" />
        <text x="8" y="18" fill="#fff" fontSize="14" fontWeight="700" fontFamily="Arial, sans-serif">AMEX</text>
    </svg>
);

const GenericLogo = () => (
    <svg viewBox="0 0 60 26" className="h-6 w-auto">
        <text x="0" y="20" fill="#fff" fontSize="16" fontWeight="700" fontFamily="Arial, sans-serif">BANK</text>
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

const PremiumCard = ({ card, className, onClick, showFullNumber = false }: PremiumCardProps) => {
    return (
        <motion.div
            layout
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(styles.premiumCard, className)}
            style={{ background: getCardGradient(card) }}
        >
            <div className={styles.cardBorder} />
            <div className={styles.cardGlass} />
            <div className={styles.cardShine} />

            <div className={styles.cardContent}>
                <div className={styles.cardTop}>
                    <div className={styles.cardLabel}>
                        <span className={styles.labelSmall}>Digital Asset</span>
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
                    <Smartphone className="h-6 w-6 text-white/30" strokeWidth={1.5} />
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
};

export default PremiumCard;
