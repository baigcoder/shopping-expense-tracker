// Sound Effects Service - Finzen
// Provides auditory feedback for user interactions

type SoundType = 'click' | 'success' | 'error' | 'warning' | 'notification' | 'transaction' | 'hover';

interface SoundConfig {
    enabled: boolean;
    volume: number; // 0-1
}

// Default configuration
let config: SoundConfig = {
    enabled: true,
    volume: 0.3
};

// Sound URLs (using Web Audio API synthesized sounds)
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

/**
 * Play a synthesized sound effect
 */
const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volumeMultiplier: number = 1) => {
    if (!config.enabled || !audioContext) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        // Envelope
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(config.volume * volumeMultiplier, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    } catch (error) {
        console.warn('Sound playback failed:', error);
    }
};

/**
 * Play a chord (multiple tones)
 */
const playChord = (frequencies: number[], duration: number, type: OscillatorType = 'sine') => {
    frequencies.forEach(freq => playTone(freq, duration, type, 0.5));
};

/**
 * Sound Effect Library
 */
export const sounds = {
    // Soft click - for buttons
    click: () => {
        playTone(800, 0.05, 'sine', 0.5);
    },

    // Success chime - for completed actions
    success: () => {
        playChord([523, 659, 784], 0.15, 'sine'); // C major chord
        setTimeout(() => playTone(1047, 0.2, 'sine'), 100);
    },

    // Error buzz - for failed actions
    error: () => {
        playTone(200, 0.1, 'square', 0.3);
        setTimeout(() => playTone(150, 0.15, 'square', 0.3), 100);
    },

    // Warning beep
    warning: () => {
        playTone(440, 0.1, 'triangle');
        setTimeout(() => playTone(440, 0.1, 'triangle'), 150);
    },

    // Notification bell
    notification: () => {
        playTone(880, 0.08, 'sine');
        setTimeout(() => playTone(1100, 0.12, 'sine'), 80);
    },

    // Transaction added - cha-ching
    transaction: () => {
        playTone(1200, 0.05, 'sine');
        setTimeout(() => playTone(1500, 0.05, 'sine'), 50);
        setTimeout(() => playTone(1800, 0.1, 'sine'), 100);
    },

    // Hover - subtle
    hover: () => {
        playTone(600, 0.02, 'sine', 0.2);
    }
};

/**
 * Play a sound effect
 */
export const playSound = (type: SoundType) => {
    if (!config.enabled) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext?.state === 'suspended') {
        audioContext.resume();
    }

    sounds[type]?.();
};

/**
 * Enable/disable sounds
 */
export const setSoundEnabled = (enabled: boolean) => {
    config.enabled = enabled;
    localStorage.setItem('finzen_sounds_enabled', String(enabled));
};

/**
 * Set volume (0-1)
 */
export const setVolume = (volume: number) => {
    config.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('finzen_sounds_volume', String(config.volume));
};

/**
 * Check if sounds are enabled
 */
export const isSoundEnabled = () => config.enabled;

/**
 * Get current volume
 */
export const getVolume = () => config.volume;

/**
 * Load settings from localStorage
 */
export const loadSoundSettings = () => {
    const enabled = localStorage.getItem('finzen_sounds_enabled');
    const volume = localStorage.getItem('finzen_sounds_volume');

    if (enabled !== null) {
        config.enabled = enabled === 'true';
    }
    if (volume !== null) {
        config.volume = parseFloat(volume);
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    loadSoundSettings();
}

export default {
    playSound,
    sounds,
    setSoundEnabled,
    setVolume,
    isSoundEnabled,
    getVolume,
    loadSoundSettings
};
