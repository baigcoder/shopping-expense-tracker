export type SoundType = "click" | "success" | "error" | "celebration" | "whoosh" | "flip" | "notification"

/**
 * Sound Manager for SpendSync
 * Handles all sound interactions with volume control and mute toggle
 */
export class SoundManager {
    private enabled: boolean = true
    private volume: number = 0.5
    private audioContext: AudioContext | null = null
    private hasUserInteracted = false

    constructor() {
        this.loadPreferences()
        this.setupInteractionUnlock()
    }

    private setupInteractionUnlock() {
        if (typeof window === "undefined") return

        const unlockAudio = () => {
            this.hasUserInteracted = true
            this.getAudioContext()?.resume().catch(() => undefined)
        }

        window.addEventListener("pointerdown", unlockAudio, { once: true })
        window.addEventListener("keydown", unlockAudio, { once: true })
        window.addEventListener("touchstart", unlockAudio, { once: true })
    }

    private getAudioContext(): AudioContext | null {
        if (typeof window === "undefined" || !this.hasUserInteracted) return null

        if (!this.audioContext) {
            const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
            this.audioContext = AudioContextCtor ? new AudioContextCtor() : null
        }

        return this.audioContext
    }

    private playTone(frequency: number, duration: number, type: OscillatorType = "sine", delay = 0, volumeMultiplier = 1) {
        const ctx = this.getAudioContext()
        if (!ctx) return

        try {
            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()
            const start = ctx.currentTime + delay

            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)
            oscillator.frequency.setValueAtTime(frequency, start)
            oscillator.type = type

            gainNode.gain.setValueAtTime(0, start)
            gainNode.gain.linearRampToValueAtTime(this.volume * volumeMultiplier, start + 0.01)
            gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration)

            oscillator.start(start)
            oscillator.stop(start + duration)
        } catch {
            // Audio is optional UI feedback.
        }
    }

    private playPattern(sound: SoundType) {
        switch (sound) {
            case "click":
                this.playTone(720, 0.04, "sine", 0, 0.35)
                break
            case "success":
                this.playTone(523, 0.12, "sine", 0, 0.25)
                this.playTone(659, 0.12, "sine", 0.04, 0.25)
                this.playTone(784, 0.16, "sine", 0.08, 0.25)
                break
            case "error":
                this.playTone(220, 0.09, "square", 0, 0.18)
                this.playTone(165, 0.12, "square", 0.08, 0.18)
                break
            case "celebration":
                ;[523, 659, 784, 1047].forEach((frequency, index) => {
                    this.playTone(frequency, 0.12, "triangle", index * 0.05, 0.22)
                })
                break
            case "whoosh":
                this.playTone(360, 0.08, "sine", 0, 0.18)
                this.playTone(640, 0.1, "sine", 0.05, 0.14)
                break
            case "flip":
                this.playTone(500, 0.05, "triangle", 0, 0.2)
                this.playTone(300, 0.05, "triangle", 0.05, 0.18)
                break
            case "notification":
                this.playTone(880, 0.08, "sine", 0, 0.22)
                this.playTone(1175, 0.1, "sine", 0.08, 0.18)
                break
        }
    }

    /**
     * Play a sound by type
     */
    play(sound: SoundType) {
        if (!this.enabled) return
        this.playPattern(sound)
    }

    /**
     * Enable or disable all sounds
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled
        localStorage.setItem("soundEnabled", JSON.stringify(enabled))
    }

    /**
     * Get current enabled state
     */
    isEnabled(): boolean {
        return this.enabled
    }

    /**
     * Set volume (0.0 to 1.0)
     */
    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume))
        localStorage.setItem("soundVolume", String(this.volume))
    }

    /**
     * Get current volume
     */
    getVolume(): number {
        return this.volume
    }

    /**
     * Load user preferences from localStorage
     */
    private loadPreferences() {
        const enabled = localStorage.getItem("soundEnabled")
        const volume = localStorage.getItem("soundVolume")

        if (enabled !== null) {
            this.enabled = JSON.parse(enabled)
        }

        if (volume !== null) {
            this.setVolume(Number(volume))
        }
    }
}

// Export singleton instance
export const soundManager = new SoundManager()
