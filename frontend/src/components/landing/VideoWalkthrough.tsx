
import { useState } from 'react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './VideoWalkthrough.module.css';

const VideoWalkthrough = () => {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <section className={styles.videoSection}>
            <div className={styles.blob} />
            <div className={styles.container}>
                <div className={styles.badge}>
                    <span>Watch Demo</span>
                </div>

                <h2 className={styles.title}>See Finzen in Action</h2>

                <motion.div
                    className={styles.videoWrapper}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    {!isPlaying ? (
                        <div className={styles.videoPlaceholder} onClick={() => setIsPlaying(true)}>
                            <div className={styles.playButton}>
                                <Play size={32} fill="white" />
                            </div>
                        </div>
                    ) : (
                        <iframe
                            width="100%"
                            height="100%"
                            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" // Placeholder video
                            title="Finzen Demo"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ position: 'absolute', top: 0, left: 0 }}
                        ></iframe>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default VideoWalkthrough;
