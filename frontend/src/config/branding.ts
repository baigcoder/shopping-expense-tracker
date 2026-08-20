// Cashly Brand Identity - Premium SaaS Finance App
// "Midnight Coral" Design System v2.0

export const BRAND = {
    name: "Cashly",
    tagline: "Finance, reviewed first",
    slogan: "Track smarter. Approve confidently.",
    description: "Review-first expense tracking with browser-extension sync, real-time insights, and AI-powered financial intelligence",

    logo: {
        light: "/logo-light.svg",
        dark: "/logo-dark.svg",
    },

    colors: {
        // Cashly Hybrid Polish - stark core with controlled accent
        primary: "#09090B",
        primaryDark: "#000000",
        primaryLight: "#F4F4F5",

        accent: "#E11D48",
        accentDark: "#BE123C",
        accentLight: "#FFE4E6",

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
