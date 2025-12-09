import { Wifi, Disc } from 'lucide-react';
import styles from './CreditCard.module.css';

const CreditCard = () => {
    return (
        <div className={styles.card}>
            <div className={styles.top}>
                <span className={styles.chip}><Disc size={24} color="#cca960" /></span>
                <Wifi size={24} className={styles.wifi} />
            </div>

            <div className={styles.number}>
                <span>****</span>
                <span>****</span>
                <span>****</span>
                <span>5491</span>
            </div>

            <div className={styles.bottom}>
                <div className={styles.details}>
                    <div className={styles.lbl}>EXPIRES END</div>
                    <div className={styles.val}>12/23/2030</div>
                    <div className={styles.name}>James Smith</div>
                </div>
                <div className={styles.logo}>VISA</div>
            </div>
        </div>
    );
};

export default CreditCard;
