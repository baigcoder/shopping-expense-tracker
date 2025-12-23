import { Howl } from "howler"

export type SoundType = "click" | "success" | "error" | "celebration" | "whoosh" | "flip" | "notification"

/**
 * Sound Manager for SpendSync
 * Handles all sound interactions with volume control and mute toggle
 */
export class SoundManager {
    private sounds: Map<SoundType, Howl> = new Map()
    private enabled: boolean = true
    private volume: number = 0.5

    constructor() {
        this.loadSounds()
        this.loadPreferences()
    }

    private loadSounds() {
        const soundFiles: Record<SoundType, string> = {
            click: "/sounds/click.mp3",
            success: "/sounds/success.mp3",
            error: "/sounds/error.mp3",
            celebration: "/sounds/celebration.mp3",
            whoosh: "/sounds/whoosh.mp3",
            flip: "/sounds/flip.mp3",
            notification: "/sounds/notification.mp3",
        }

        Object.entries(soundFiles).forEach(([key, src]) => {
            this.sounds.set(key as SoundType, new Howl({
                src: [src],
                volume: this.volume,
                html5: true, // Better for web
            }))
        })
    }

    /**
     * Play a sound by type
     */
    play(sound: SoundType) {
        if (!this.enabled) return
        this.sounds.get(sound)?.play()
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
        this.sounds.forEach(sound => sound.volume(this.volume))
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
