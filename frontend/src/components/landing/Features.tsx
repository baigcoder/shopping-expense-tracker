
import { Zap, PieChart, Brain, Target, Repeat, BarChart3 } from 'lucide-react';
import styles from './Features.module.css';
import FeatureCard from './FeatureCard';

const featuresData = [
    {
        icon: Zap,
        title: "Zero Manual Entry",
        description: "Our browser extension captures your online purchases automatically as you shop. No receipts to scan, no fields to type.",
        color: 'red' as const,
        delay: 0,
        isAutoFeature: true
    },
    {
        icon: PieChart,
        title: "Smart Budgets",
        description: "Set custom limits for each category. We'll alert you before you overspend, keeping your financial goals on track.",
        color: 'amber' as const,
        delay: 0.1
    },
    {
        icon: Brain,
        title: "AI Money Twin",
        description: "Your personal financial forecaster. Predicts future spending, identifies risks, and suggests ways to save.",
        color: 'emerald' as const,
        delay: 0.2
    },
    {
        icon: Target,
        title: "Goals & Savings",
        description: "Visualize your progress towards customized savings goals. Celebrate every milestone on your journey.",
        color: 'blue' as const,
        delay: 0
    },
    {
        icon: Repeat,
        title: "Subscription Tracker",
        description: "Never miss a renewal again. Track all your recurring payments in one place and spot forgotten subscriptions.",
        color: 'red' as const,
        delay: 0.1
    },
    {
        icon: BarChart3,
        title: "Deep Analytics",
        description: "Interactive charts and merchant insights help you understand exactly where your money goes every month.",
        color: 'amber' as const,
        delay: 0.2
    }
];

const Features = () => {
    return (
        <section className={styles.featuresSection} id="features">
            <div className={styles.container}>
                <div className={styles.grid}>
                    {featuresData.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            {...feature}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
