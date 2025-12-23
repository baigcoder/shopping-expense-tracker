// Type declarations for modules without types

declare module 'canvas-confetti' {
    interface ConfettiOptions {
        particleCount?: number;
        spread?: number;
        origin?: { x?: number; y?: number };
        colors?: string[];
        angle?: number;
        startVelocity?: number;
        decay?: number;
        gravity?: number;
        ticks?: number;
        scalar?: number;
        shapes?: ('square' | 'circle')[];
        zIndex?: number;
    }

    function confetti(options?: ConfettiOptions): Promise<null>;

    namespace confetti {
        function reset(): void;
    }

    export = confetti;
}
