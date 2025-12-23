/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "media",
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Cashly Brand Colors
                emerald: {
                    50: "#ECFDF5",
                    100: "#D1FAE5",
                    200: "#A7F3D0",
                    300: "#6EE7B7",
                    400: "#34D399",
                    500: "#10B981",
                    600: "#059669",
                    700: "#047857",
                    800: "#065F46",
                    900: "#064E3B",
                },
                violet: {
                    50: "#F5F3FF",
                    100: "#EDE9FE",
                    200: "#DDD6FE",
                    300: "#C4B5FD",
                    400: "#A78BFA",
                    500: "#8B5CF6",
                    600: "#7C3AED",
                    700: "#6D28D9",
                    800: "#5B21B6",
                    900: "#4C1D95",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl: "1rem",
                "2xl": "1.5rem",
                "3xl": "2rem",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Space Grotesk", "Inter", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            fontSize: {
                "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
            },
            boxShadow: {
                "glow-sm": "0 2px 8px -2px rgba(16, 185, 129, 0.3)",
                "glow": "0 4px 16px -4px rgba(16, 185, 129, 0.4)",
                "glow-lg": "0 8px 32px -8px rgba(16, 185, 129, 0.5)",
                "glow-violet": "0 4px 16px -4px rgba(124, 58, 237, 0.4)",
                "card-hover": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "mesh-gradient": "radial-gradient(at 40% 20%, hsla(160,90%,50%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(263,90%,60%,0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(160,90%,60%,0.1) 0px, transparent 50%)",
                "hero-gradient": "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(124,58,237,0.1) 100%)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                "fade-in-up": {
                    from: { opacity: "0", transform: "translateY(20px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "fade-in-down": {
                    from: { opacity: "0", transform: "translateY(-20px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "slide-in-left": {
                    from: { opacity: "0", transform: "translateX(-20px)" },
                    to: { opacity: "1", transform: "translateX(0)" },
                },
                "slide-in-right": {
                    from: { opacity: "0", transform: "translateX(20px)" },
                    to: { opacity: "1", transform: "translateX(0)" },
                },
                "scale-in": {
                    from: { opacity: "0", transform: "scale(0.95)" },
                    to: { opacity: "1", transform: "scale(1)" },
                },
                "shimmer": {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                "pulse-slow": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.5" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                "bounce-gentle": {
                    "0%, 100%": { transform: "translateY(-3%)", animationTimingFunction: "cubic-bezier(0.8,0,1,1)" },
                    "50%": { transform: "none", animationTimingFunction: "cubic-bezier(0,0,0.2,1)" },
                },
                "gradient-shift": {
                    "0%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                    "100%": { backgroundPosition: "0% 50%" },
                },
                "ripple": {
                    "0%": { transform: "scale(0)", opacity: "0.5" },
                    "100%": { transform: "scale(4)", opacity: "0" },
                },
                "number-tick": {
                    "0%": { transform: "translateY(0)" },
                    "10%": { transform: "translateY(-105%)" },
                    "20%": { transform: "translateY(-105%)" },
                    "30%": { transform: "translateY(-205%)" },
                    "100%": { transform: "translateY(-205%)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.3s ease-out",
                "fade-in-up": "fade-in-up 0.5s ease-out",
                "fade-in-down": "fade-in-down 0.5s ease-out",
                "slide-in-left": "slide-in-left 0.3s ease-out",
                "slide-in-right": "slide-in-right 0.3s ease-out",
                "scale-in": "scale-in 0.2s ease-out",
                "shimmer": "shimmer 2s linear infinite",
                "pulse-slow": "pulse-slow 3s ease-in-out infinite",
                "float": "float 3s ease-in-out infinite",
                "bounce-gentle": "bounce-gentle 2s infinite",
                "gradient-shift": "gradient-shift 8s ease infinite",
                "ripple": "ripple 0.6s linear",
            },
            transitionTimingFunction: {
                "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
                "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
