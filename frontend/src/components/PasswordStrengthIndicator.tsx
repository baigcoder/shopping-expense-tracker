// Password Strength Indicator Component - Gen-Z Styled
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { checkPasswordStrength, PasswordStrength } from '../utils/validationUtils';
import styles from './PasswordStrengthIndicator.module.css';

interface PasswordStrengthIndicatorProps {
    password: string;
    showRequirements?: boolean;
}

const PasswordStrengthIndicator = ({ password, showRequirements = true }: PasswordStrengthIndicatorProps) => {
    const result = checkPasswordStrength(password);

    if (!password) return null;

    const getStrengthColor = () => {
        switch (result.strength) {
            case PasswordStrength.WEAK:
                return '#EF4444'; // Red
            case PasswordStrength.FAIR:
                return '#F59E0B'; // Orange
            case PasswordStrength.GOOD:
                return '#3B82F6'; // Blue
            case PasswordStrength.STRONG:
                return '#10B981'; // Green
            default:
                return '#9CA3AF'; // Gray
        }
    };

    const requirements = [
        { label: 'At least 8 characters', met: result.requirements.minLength },
        { label: 'One uppercase letter', met: result.requirements.hasUpperCase },
        { label: 'One lowercase letter', met: result.requirements.hasLowerCase },
        { label: 'One number', met: result.requirements.hasNumber },
        { label: 'One special character', met: result.requirements.hasSpecialChar }
    ];

    return (
        <div className={styles.container}>
            {/* Strength Bar */}
            <div className={styles.strengthBar}>
                <motion.div
                    className={styles.strengthFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.score}%` }}
                    transition={{ duration: 0.3 }}
                    style={{ backgroundColor: getStrengthColor() }}
                />
            </div>

            {/* Strength Label */}
            <motion.div
                className={styles.strengthLabel}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ color: getStrengthColor() }}
            >
                <span className={styles.strengthText}>{result.strength.toUpperCase()}</span>
                <span className={styles.strengthFeedback}>{result.feedback}</span>
            </motion.div>

            {/* Requirements Checklist */}
            {showRequirements && (
                <motion.div
                    className={styles.requirements}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.1 }}
                >
                    {requirements.map((req, index) => (
                        <motion.div
                            key={index}
                            className={`${styles.requirement} ${req.met ? styles.met : ''}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                        >
                            <div className={styles.requirementIcon}>
                                {req.met ? (
                                    <Check size={14} strokeWidth={3} />
                                ) : (
                                    <X size={14} strokeWidth={3} />
                                )}
                            </div>
                            <span className={styles.requirementLabel}>{req.label}</span>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default PasswordStrengthIndicator;
