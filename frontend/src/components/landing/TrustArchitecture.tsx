import { ShieldCheck, Lock, Database, EyeOff, KeyRound } from 'lucide-react';

const securityLayers = [
    {
        num: '01',
        title: 'Client-Side DOM Parsing',
        subtitle: 'LOCAL BROWSER SANDBOX',
        desc: 'The browser extension parses checkout totals entirely inside your local browser runtime. Web browsing history and private cookies never leave your machine.',
        icon: EyeOff
    },
    {
        num: '02',
        title: 'Zero Bank Credentials',
        subtitle: 'NO PLAID / BANK PASSWORDS',
        desc: 'We never ask for bank usernames, passwords, or security answers. Your bank account remains completely decoupled from our software.',
        icon: KeyRound
    },
    {
        num: '03',
        title: 'Isolated Staging Queue',
        subtitle: 'GATEWAY SEPARATION',
        desc: 'Incoming captures enter an unapproved staging queue. Your canonical ledger and financial runway remain immutable until you click Approve.',
        icon: Lock
    },
    {
        num: '04',
        title: 'Row-Level Security (RLS)',
        subtitle: 'SUPABASE POSTGRESQL',
        desc: 'Every ledger record is cryptographically isolated by PostgreSQL Row-Level Security policies. Only your authenticated user key can read or mutate your data.',
        icon: Database
    },
];

export default function TrustArchitecture() {
    return (
        <section id="trust" className="landing-trust-arch scroll-mt-20">
            <div className="landing-trust-arch__header">
                <div className="landing-trust-arch__tag">
                    <ShieldCheck size={14} />
                    <span>SECURITY & PRIVACY ARCHITECTURE</span>
                </div>

                <h2 className="landing-trust-arch__title">
                    ENGINEERED AROUND<br />
                    DATA SOVEREIGNTY.
                </h2>

                <p className="landing-trust-arch__sub">
                    Security is not an afterthought banner. It is baked into the fundamental pipeline of how data flows through Cashly.
                </p>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="landing-trust-arch__diagram">
                <div className="arch-flow-node">
                    <span className="arch-node-badge">STEP 1</span>
                    <strong className="arch-node-title">Online Store</strong>
                    <span className="arch-node-sub">Amazon / Shopify</span>
                </div>

                <div className="arch-flow-arrow">→</div>

                <div className="arch-flow-node">
                    <span className="arch-node-badge">STEP 2</span>
                    <strong className="arch-node-title">Local Companion</strong>
                    <span className="arch-node-sub">Zero credential scraping</span>
                </div>

                <div className="arch-flow-arrow">→</div>

                <div className="arch-flow-node arch-flow-node--highlight">
                    <span className="arch-node-badge">STEP 3</span>
                    <strong className="arch-node-title">Review Queue</strong>
                    <span className="arch-node-sub">Sovereign User Consent</span>
                </div>

                <div className="arch-flow-arrow">→</div>

                <div className="arch-flow-node">
                    <span className="arch-node-badge">STEP 4</span>
                    <strong className="arch-node-title">Canonical Ledger</strong>
                    <span className="arch-node-sub">Encrypted PostgreSQL</span>
                </div>
            </div>

            {/* Architectural Security Layers Grid */}
            <div className="landing-trust-arch__grid">
                {securityLayers.map((layer) => {
                    const IconComponent = layer.icon;
                    return (
                        <div key={layer.num} className="arch-layer-card">
                            <div className="arch-layer-card__top">
                                <span className="arch-layer-num">{layer.num}</span>
                                <div className="arch-layer-icon">
                                    <IconComponent size={20} />
                                </div>
                            </div>
                            <span className="arch-layer-sub">{layer.subtitle}</span>
                            <h3 className="arch-layer-title">{layer.title}</h3>
                            <p className="arch-layer-desc">{layer.desc}</p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
