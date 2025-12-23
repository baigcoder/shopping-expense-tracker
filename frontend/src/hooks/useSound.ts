import { soundManager, type SoundType } from "@/lib/sounds"

/**
 * Custom React hook for playing sounds
 * Usage: const sound = useSound()
 *        sound.playClick()
 */
export function useSound() {
    return {
        playClick: () => soundManager.play("click"),
        playSuccess: () => soundManager.play("success"),
        playError: () => soundManager.play("error"),
        playCelebration: () => soundManager.play("celebration"),
        playWhoosh: () => soundManager.play("whoosh"),
        playFlip: () => soundManager.play("flip"),
        playNotification: () => soundManager.play("notification"),

        // Control functions
        setEnabled: (enabled: boolean) => soundManager.setEnabled(enabled),
        isEnabled: () => soundManager.isEnabled(),
        setVolume: (volume: number) => soundManager.setVolume(volume),
        getVolume: () => soundManager.getVolume(),
    }
}
