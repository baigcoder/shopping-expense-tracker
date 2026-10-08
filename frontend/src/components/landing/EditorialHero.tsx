import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp, Check, RotateCcw, ShoppingBag, Lock, Zap, Terminal, CornerDownLeft } from 'lucide-react';
import { useLandingSettings } from './useLandingSettings';

const STORES = [
    { id: 'amazon', name: 'amazon.com', item: 'Sony WH-1000XM5', price: 34990, category: 'Electronics • Discretionary' },
    { id: 'shopify', name: 'gymshark.com', item: 'Seamless Training Set', price: 4200, category: 'Apparel • Discretionary' },
    { id: 'uber', name: 'uber.com', item: 'Airport Transit Ride', price: 950, category: 'Transport • Transit' },
    { id: 'swiggy', name: 'swiggy.com', item: 'Gourmet Dinner Feast', price: 1850, category: 'Dining • Discretionary' },
];

const COMMAND_PRESETS = [
    'spent 450 at Nandos',
    '> runway',
    'cap dining at Rs 20,000',
    'paid 1200 for groceries',
];

export default function EditorialHero() {
    const { formatAmount, playSound } = useLandingSettings();
    const [selectedStoreIndex, setSelectedStoreIndex] = useState(0);
    const [interceptApproved, setInterceptApproved] = useState(false);
    const [copilotActionExecuted, setCopilotActionExecuted] = useState(false);
    const [commandQuery, setCommandQuery] = useState('spent 450 at Nandos');
    const [commandLogged, setCommandLogged] = useState(false);

    const activeStore = STORES[selectedStoreIndex];

    const handleSwitchStore = (idx: number) => {
        setSelectedStoreIndex(idx);
        setInterceptApproved(false);
        playSound('click');
    };

    const handleApproveIntercept = () => {
        setInterceptApproved(true);
        playSound('success');
    };

    const handleCopilotAction = () => {
        setCopilotActionExecuted(true);
        playSound('success');
    };

    const handleLogCommand = () => {
        setCommandLogged(true);
        playSound('success');
        setTimeout(() => setCommandLogged(false), 2400);
    };

    return (
        <section className="landing-editorial-hero">
            <div className="landing-editorial-hero__inner">
                {/* Campaign Header Eyebrow */}
                <div className="landing-editorial-hero__tag">
                    <span className="landing-editorial-hero__tag-dot">●</span>
                    <span>THE REVIEW-FIRST FINANCIAL OPERATING SYSTEM</span>
                </div>

                {/* Monumental Headline */}
                <h1 className="landing-editorial-hero__title">
                    SEE WHAT<br />
                    YOUR MONEY<br />
                    IS DOING.
                </h1>

                {/* Asymmetric Subtitle & Actions Bar */}
                <div className="landing-editorial-hero__action-bar">
                    <p className="landing-editorial-hero__description">
                        Cashly captures checkouts silently from Amazon, Shopify, and any store,
                        stages them in a private review queue, and recalculates your forward runway
                        before purchases touch your canonical ledger.
                    </p>

                    <div className="landing-editorial-hero__ctas">
                        <Link to="/signup" className="landing-btn landing-btn--primary">
                            <span>Start with Cashly</span>
                            <ArrowRight size={16} />
                        </Link>
                        <Link
                            to="/demo"
                            className="landing-btn landing-btn--demo"
                            title="Open full interactive Cashly OS Sandbox"
                        >
                            <span className="landing-nav__demo-pulse" style={{ background: '#FFFFFF' }} />
                            <span>⚡ Launch Live Demo OS</span>
                            <ArrowRight size={14} />
                        </Link>
                        <a href="#triptych" className="landing-btn landing-btn--secondary">
                            <span>Explore Ecosystem</span>
                            <span style={{ opacity: 0.5 }}>↓</span>
                        </a>
                    </div>
                </div>

                {/* ─── INTERACTIVE NATURAL LANGUAGE COMMAND BAR SANDBOX ─── */}
                <div className="landing-hero-cmd-sandbox">
                    <div className="landing-hero-cmd-sandbox__bar">
                        <div className="landing-hero-cmd-sandbox__input-wrap">
                            <Terminal size={15} className="text-[var(--landing-orange)] shrink-0" />
                            <input
                                type="text"
                                value={commandQuery}
                                onChange={(e) => setCommandQuery(e.target.value)}
                                placeholder="Type: 'spent 450 at Nandos' or '> runway'..."
                                className="landing-hero-cmd-sandbox__input"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleLogCommand}
                            className="landing-hero-cmd-sandbox__action-btn"
                        >
                            {commandLogged ? (
                                <>
                                    <Check size={13} className="text-emerald-400" />
                                    <span>Parsed & Staged</span>
                                </>
                            ) : (
                                <>
                                    <span>Simulate Enter</span>
                                    <CornerDownLeft size={13} />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="landing-hero-cmd-sandbox__presets">
                        <span className="landing-hero-cmd-sandbox__hint">Try live shortcuts:</span>
                        {COMMAND_PRESETS.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                    setCommandQuery(preset);
                                    playSound('click');
                                }}
                                className={`landing-hero-cmd-sandbox__chip ${
                                    commandQuery === preset ? 'landing-hero-cmd-sandbox__chip--active' : ''
                                }`}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── LIVING PRODUCT HUD MODULES ABOVE THE FOLD ─── */}
                <div className="landing-editorial-hero__teaser">
                    
                    {/* MODULE 1: Cadmium Orange — Live Browser Interception HUD */}
                    <div className="landing-hero-teaser__card landing-hero-teaser__card--orange">
                        <div className="landing-hero-teaser__hud-header">
                            <div className="landing-hero-teaser__badge">
                                <span className="landing-hero-teaser__live-dot" />
                                <span>COMPANION LIVE CAPTURE</span>
                            </div>
                            <span className="landing-hero-teaser__store-tag">
                                <ShoppingBag size={11} />
                                {activeStore.name}
                            </span>
                        </div>

                        {/* Store Switcher Tabs */}
                        <div className="landing-hero-teaser__store-selector">
                            {STORES.map((s, idx) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => handleSwitchStore(idx)}
                                    className={`landing-hero-teaser__store-btn ${
                                        selectedStoreIndex === idx ? 'landing-hero-teaser__store-btn--active' : ''
                                    }`}
                                >
                                    {s.name.replace('.com', '')}
                                </button>
                            ))}
                        </div>

                        <div className="landing-hero-teaser__product-body">
                            <div className="landing-hero-teaser__item-row">
                                <span className="landing-hero-teaser__item-name">{activeStore.item}</span>
                                <span className="landing-hero-teaser__item-price">{formatAmount(activeStore.price)}</span>
                            </div>
                            <div className="landing-hero-teaser__item-meta">
                                <span className="landing-hero-teaser__item-cat">{activeStore.category}</span>
                                <span className="landing-hero-teaser__security-pill">
                                    <Lock size={10} /> Zero Passwords
                                </span>
                            </div>
                        </div>

                        <div className="landing-hero-teaser__hud-footer">
                            {!interceptApproved ? (
                                <button
                                    onClick={handleApproveIntercept}
                                    className="landing-hero-teaser__btn landing-hero-teaser__btn--white"
                                    type="button"
                                >
                                    <span>Approve & Post to Ledger</span>
                                    <ArrowRight size={13} />
                                </button>
                            ) : (
                                <div className="landing-hero-teaser__status-confirmed">
                                    <div className="landing-hero-teaser__status-text">
                                        <Check size={14} className="landing-hero-teaser__check-icon" />
                                        <span>Reconciled to Ledger • Safe: {formatAmount(42870)}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setInterceptApproved(false);
                                            playSound('click');
                                        }}
                                        className="landing-hero-teaser__replay-btn"
                                        title="Reset demo"
                                        type="button"
                                    >
                                        <RotateCcw size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MODULE 2: Deep Ink — Money Twin Predictive Trajectory HUD */}
                    <div className="landing-hero-teaser__card landing-hero-teaser__card--ink">
                        <div className="landing-hero-teaser__hud-header">
                            <div className="landing-hero-teaser__badge">
                                <TrendingUp size={13} />
                                <span>MONEY TWIN™ RUNWAY ENGINE</span>
                            </div>
                            <span className="landing-hero-teaser__metric-badge text-emerald-400">
                                +12 Days Gained
                            </span>
                        </div>

                        <div className="landing-hero-teaser__metric">
                            <div className="flex items-baseline justify-between">
                                <span className="landing-hero-teaser__num">{formatAmount(27150)}</span>
                                <span className="text-xs font-mono text-emerald-400 font-bold">42-Day Runway</span>
                            </div>
                            <span className="landing-hero-teaser__lbl">Projected Month-End Cash</span>
                        </div>

                        {/* Live SVG Runway Curve */}
                        <div className="landing-hero-teaser__chart-wrap">
                            <svg viewBox="0 0 280 44" className="w-full h-11" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="heroRunwayGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                {/* Area fill */}
                                <path
                                    d="M 0 36 C 50 34, 100 28, 140 22 C 180 16, 220 10, 280 4 L 280 44 L 0 44 Z"
                                    fill="url(#heroRunwayGrad)"
                                />
                                {/* Baseline safe threshold */}
                                <line x1="0" y1="36" x2="280" y2="36" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" strokeWidth="1" />
                                {/* Trajectory Line */}
                                <path
                                    d="M 0 36 C 50 34, 100 28, 140 22 C 180 16, 220 10, 280 4"
                                    fill="none"
                                    stroke="#10B981"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                                {/* Today Marker */}
                                <circle cx="140" cy="22" r="3.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2" />
                            </svg>
                        </div>

                        <div className="landing-hero-teaser__telemetry-row">
                            <span>Burn: {formatAmount(1420)}/day</span>
                            <span className="font-mono text-emerald-400 font-bold">Zero Deficit Risk</span>
                        </div>
                    </div>

                    {/* MODULE 3: Candy Pink — Cashly Copilot Decision Surface */}
                    <div className="landing-hero-teaser__card landing-hero-teaser__card--pink">
                        <div className="landing-hero-teaser__hud-header">
                            <div className="landing-hero-teaser__badge">
                                <Sparkles size={13} />
                                <span>CASHLY COPILOT</span>
                            </div>
                            <span className="landing-hero-teaser__live-pill">
                                <Zap size={11} /> LIVE TELEMETRY
                            </span>
                        </div>

                        <div className="landing-hero-teaser__copilot-content">
                            <p className="landing-hero-teaser__insight-text">
                                &ldquo;{formatAmount(3200)} discretionary headroom detected above your 30-day runway target.&rdquo;
                            </p>
                        </div>

                        <div className="landing-hero-teaser__hud-footer">
                            {!copilotActionExecuted ? (
                                <div className="landing-hero-teaser__chip-row">
                                    <button
                                        onClick={handleCopilotAction}
                                        className="landing-hero-teaser__action-chip landing-hero-teaser__action-chip--primary"
                                        type="button"
                                    >
                                        <span>+ Vault {formatAmount(3000)}</span>
                                    </button>
                                    <button
                                        onClick={handleCopilotAction}
                                        className="landing-hero-teaser__action-chip landing-hero-teaser__action-chip--secondary"
                                        type="button"
                                    >
                                        <span>Adjust Pacing</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="landing-hero-teaser__copilot-success">
                                    <div className="landing-hero-teaser__status-text">
                                        <Check size={14} className="text-emerald-700" />
                                        <span>{formatAmount(3000)} Moved to Vault (+3.4d Runway)</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCopilotActionExecuted(false);
                                            playSound('click');
                                        }}
                                        className="landing-hero-teaser__replay-btn text-neutral-800"
                                        title="Reset demo"
                                        type="button"
                                    >
                                        <RotateCcw size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
