// Cashly Brand Identity - Premium SaaS Finance App
// "Midnight Coral" Design System v2.0

export const BRAND = {
    name: "Cashly",
    tagline: "Your Money, Simplified",
    slogan: "Track smarter. Save effortlessly.",
    description: "Automated expense tracking with real-time insights and AI-powered financial intelligence",

    logo: {
        light: "/logo-light.svg",
        dark: "/logo-dark.svg",
    },

    colors: {
        // Midnight Coral Theme - Teal + Coral/Orange
        primary: "#14B8A6",       // Teal 500
        primaryDark: "#0D9488",   // Teal 600
        primaryLight: "#CCFBF1",  // Teal 100

        accent: "#FB7A47",        // Coral/Orange
        accentDark: "#EA5F2C",    // Coral Dark
        accentLight: "#FFF7ED",   // Orange 50

        success: "#22C55E",       // Green 500
        warning: "#F59E0B",       // Amber 500
        danger: "#EF4444",        // Red 500

        // Neutral - Warm Stone
        background: "#FAFAF9",    // Stone 50
        foreground: "#1C1917",    // Stone 900
        muted: "#F5F5F4",         // Stone 100
        border: "#E7E5E4",        // Stone 200
    },

    features: [
        "Automatic transaction detection via browser extension",
        "Real-time sync across all devices",
        "AI-powered spending insights with MoneyTwin",
        "Multi-card management with custom themes",
        "Budget tracking and goal setting",
        "Receipt scanning with OCR",
        "Advanced analytics and reports",
        "Dark mode support",
        "Sound feedback interactions",
    ],

    links: {
        website: "https://cashly.app",
        github: "https://github.com/baigcoder/cashly",
        extension: "https://chrome.google.com/webstore/detail/cashly",
    },

    fonts: {
        display: "Plus Jakarta Sans",
        body: "Inter",
        mono: "JetBrains Mono",
    },
}

export default BRAND
