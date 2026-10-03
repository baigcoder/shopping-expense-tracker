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
                cream: "#FAF8F5",
                ink: "#142127",
                rose: {
                    DEFAULT: "#0E8174",
                    dark: "#095B52",
                },
                v9: {
                    midnight: "#09141B",
                    deep: "#101E25",
                    "surface-dark": "#142832",
                    ivory: "#F4F3EE",
                    soft: "#E9ECE8",
                    "surface-light": "#FFFFFF",
                    jade: {
                        DEFAULT: "#0E8174",
                        bright: "#16A394",
                        soft: "#DDF3EF",
                    },
                    "text-dark": "#F7F6F1",
                    "text-dark-muted": "#B6C1BF",
                    "text-dark-dim": "#76888B",
                    "text-light": "#142127",
                    "text-light-muted": "#56656A",
                    "text-light-dim": "#86969C",
                    success: {
                        DEFAULT: "#17824F",
                        bright: "#1EA966",
                        soft: "#E3F4EA",
                    },
                    warning: {
                        DEFAULT: "#B8680B",
                        bright: "#D97706",
                        soft: "#FFF1DA",
                    },
                    danger: {
                        DEFAULT: "#C94343",
                        bright: "#E54B4B",
                        soft: "#FBE9E9",
                    },
                    info: {
                        DEFAULT: "#3677E8",
                        soft: "#EAF1FF",
                    },
                    ai: {
                        DEFAULT: "#7753C7",
                        bright: "#8B62EA",
                        soft: "#F1ECFF",
                    },
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl: "1rem",
                "2xl": "1.25rem",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
                mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
            },
            fontSize: {
                "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
            },
            boxShadow: {
                "card-hover": "0 1px 2px rgba(28, 25, 23, 0.06), 0 8px 24px rgba(28, 25, 23, 0.08)",
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
                    from: { opacity: "0", transform: "translateY(8px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.18s ease-out",
                "fade-in-up": "fade-in-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
