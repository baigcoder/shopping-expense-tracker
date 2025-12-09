import { ReactNode } from 'react';
import styles from './AuthLayout.module.css';
import { Outlet } from 'react-router-dom';

/* Logo Component */
const BrandLogo = () => (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 20C12 20 8 16 8 10C8 4 14 6 16 8C18 10 20 20 20 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 20C28 20 32 16 32 10C32 4 26 6 24 8C22 10 20 20 20 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M12 20C12 20 8 24 8 30C8 36 14 34 16 32C18 30 20 20 20 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 20C28 20 32 24 32 30C32 36 26 34 24 32C22 30 20 20 20 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const AuthLayout = () => {
    return (
        <div className={styles.container}>
            <div className={styles.authCard}>
                {/* Visual Side */}
                <div className={styles.visualSide}>
                    <div className={styles.brandHeader}>
                        <div className={styles.logo}>
                            <BrandLogo />
                            <span>ExpenseTracker</span>
                        </div>
                        <div className={styles.heroText}>
                            <h1>Manage your<br />Finances efficiently</h1>
                            <p>Track your spending, manage cards, and view analytics in one beautiful dashboard.</p>
                        </div>
                    </div>

                    <div className={styles.cardPreview}>
                        <div className={styles.mockCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <span>VISA</span>
                                <span>$$$</span>
                            </div>
                            <div style={{ fontSize: '1.2rem', letterSpacing: '2px' }}>**** **** **** 1234</div>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className={styles.formSide}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
