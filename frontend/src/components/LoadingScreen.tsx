// Loading Screen Component - Cashly Light Theme
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { notificationSound } from '../services/notificationSoundService';
import BRAND from '@/config/branding';

const LoadingScreen = () => {
    useEffect(() => {
        const timer = setTimeout(() => {
            notificationSound.playPop();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-blue-50" />

            {/* Animated circles */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Logo */}
                <motion.div
                    className="relative mb-8"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    {/* Logo container with gradient */}
                    <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                        <motion.svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <motion.path
                                d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{
                                    duration: 1.5,
                                    ease: "easeInOut",
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                }}
                            />
                        </motion.svg>
                    </div>

                    {/* Glow effect */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl"
                        animate={{
                            boxShadow: [
                                "0 0 30px hsl(var(--primary) / 0.2)",
                                "0 0 60px hsl(var(--primary) / 0.4)",
                                "0 0 30px hsl(var(--primary) / 0.2)"
                            ]
                        }}

                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </motion.div>

                {/* Brand name */}
                <motion.h2
                    className="text-3xl font-bold font-display tracking-tight mb-2 text-slate-800"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className="text-primary">
                        {BRAND.name}
                    </span>
                </motion.h2>

                {/* Tagline */}
                <motion.p
                    className="text-sm text-slate-500 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {BRAND.tagline}
                </motion.p>

                {/* Loading bar */}
                <motion.div
                    className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                            duration: 1.5,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    />
                </motion.div>

                {/* Dots animation */}
                <div className="flex gap-1.5 mt-6">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default LoadingScreen;


