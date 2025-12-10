// Gen-Z Notification Sound Service
// Creates fun, modern notification sounds using Web Audio API

class NotificationSoundService {
    private audioContext: AudioContext | null = null;
    private isEnabled: boolean = true;

    private getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    // Toggle sounds on/off
    toggle(enabled: boolean) {
        this.isEnabled = enabled;
    }

    // Pop sound - for success notifications 🎉
    playPop() {
        if (!this.isEnabled) return;
        try {
            const ctx = this.getAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.05);
            oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);
        } catch (e) {
            console.log('Sound not available');
        }
    }

    // Ding sound - for info/warning notifications 🔔
    playDing() {
        if (!this.isEnabled) return;
        try {
            const ctx = this.getAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.2);
        } catch (e) {
            console.log('Sound not available');
        }
    }

    // Alert sound - for error/warning notifications ⚠️
    playAlert() {
        if (!this.isEnabled) return;
        try {
            const ctx = this.getAudioContext();

            // Two-tone alert
            for (let i = 0; i < 2; i++) {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(i === 0 ? 400 : 300, ctx.currentTime + i * 0.15);

                gainNode.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.12);

                oscillator.start(ctx.currentTime + i * 0.15);
                oscillator.stop(ctx.currentTime + i * 0.15 + 0.12);
            }
        } catch (e) {
            console.log('Sound not available');
        }
    }

    // Sparkle sound - for achievements/milestones ✨
    playSparkle() {
        if (!this.isEnabled) return;
        try {
            const ctx = this.getAudioContext();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

            notes.forEach((freq, i) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

                gainNode.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);

                oscillator.start(ctx.currentTime + i * 0.08);
                oscillator.stop(ctx.currentTime + i * 0.08 + 0.15);
            });
        } catch (e) {
            console.log('Sound not available');
        }
    }

    // Cash sound - for money-related notifications 💰
    playCash() {
        if (!this.isEnabled) return;
        try {
            const ctx = this.getAudioContext();

            // Coin drop sound
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(2000, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);

            // Second bounce
            setTimeout(() => {
                try {
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.type = 'triangle';
                    osc2.frequency.setValueAtTime(1500, ctx.currentTime);
                    osc2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
                    gain2.gain.setValueAtTime(0.2, ctx.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    osc2.start(ctx.currentTime);
                    osc2.stop(ctx.currentTime + 0.1);
                } catch (e) { }
            }, 100);
        } catch (e) {
            console.log('Sound not available');
        }
    }

    // Level up sound - for completing goals 🎮
    playLevelUp() {
        if (!this.isEnabled) return;
        try {
            const ctx = this.getAudioContext();
            const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99]; // C4-G5 arpeggio

            notes.forEach((freq, i) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);

                gainNode.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.07);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.07 + 0.1);

                oscillator.start(ctx.currentTime + i * 0.07);
                oscillator.stop(ctx.currentTime + i * 0.07 + 0.1);
            });
        } catch (e) {
            console.log('Sound not available');
        }
    }
}

export const notificationSound = new NotificationSoundService();
