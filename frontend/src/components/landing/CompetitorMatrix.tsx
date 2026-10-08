import { useState } from 'react';
import { Check, X, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLandingSettings } from './useLandingSettings';

interface FeatureComparison {
    feature: string;
    description: string;
    cashly: { status: boolean; note: string };
    ynab: { status: boolean | 'partial'; note: string };
    monarch: { status: boolean | 'partial'; note: string };
    banks: { status: boolean; note: string };
}

const COMPARISONS: FeatureComparison[] = [
    {
        feature: 'Browser Checkout Interception',
        description: 'Captures purchases at the point of intent on Amazon & Shopify before card swipe occurs',
        cashly: { status: true, note: 'Companion Extension' },
        ynab: { status: false, note: 'Manual / Post-facto' },
        monarch: { status: false, note: 'Plaid delayed sync' },
        banks: { status: false, note: '2-3 day statement lag' },
    },
    {
        feature: 'Sovereign Staged Review Queue',
        description: 'Every expense sits in a private review inbox before touching your canonical budget balance',
        cashly: { status: true, note: 'Zero auto-drift' },
        ynab: { status: 'partial', note: 'Approval required but reactive' },
        monarch: { status: false, note: 'Auto-categorizes silently' },
        banks: { status: false, note: 'No review pipeline' },
    },
    {
        feature: 'Money Twin™ Predictive Runway',
        description: 'Dynamic burn velocity projection with early Deficit Collision alerts for fixed rent obligations',
        cashly: { status: true, note: 'Real-time curve & radar' },
        ynab: { status: 'partial', note: 'Static "Age of Money"' },
        monarch: { status: false, note: 'Backward trends only' },
        banks: { status: false, note: 'Static balance statement' },
    },
    {
        feature: 'Executable AI Co-Pilot',
        description: 'AI with one-click Action Chips that mutate budgets, pause subscriptions, or adjust runway pacing',
        cashly: { status: true, note: 'Executable Action Chips' },
        ynab: { status: false, note: 'No AI copilot' },
        monarch: { status: 'partial', note: 'Passive conversational chat' },
        banks: { status: false, note: 'Basic customer service bot' },
    },
    {
        feature: 'Zero Bank Credential Exposure',
        description: 'No Plaid or MX credential handoffs. Your banking passwords never touch our servers or third-party scrapers',
        cashly: { status: true, note: 'Cryptographic privacy' },
        ynab: { status: false, note: 'Requires Plaid / Finicity' },
        monarch: { status: false, note: 'Requires Plaid / MX' },
        banks: { status: true, note: 'Internal only' },
    },
    {
        feature: 'Tactile Ergonomics & Multi-Currency',
        description: 'Keyboard-first command bar (Cmd+K), sub-millisecond acoustic haptics, and instant FX conversions',
        cashly: { status: true, note: 'Acoustic & Multi-FX' },
        ynab: { status: false, note: 'Single currency' },
        monarch: { status: false, note: 'USD / CAD limited' },
        banks: { status: false, note: 'Clunky legacy portals' },
    },
];

export default function CompetitorMatrix() {
    const { playSound } = useLandingSettings();
    const [selectedCompetitor, setSelectedCompetitor] = useState<'all' | 'ynab' | 'monarch' | 'banks'>('all');

    const handleSelectFilter = (filter: 'all' | 'ynab' | 'monarch' | 'banks') => {
        setSelectedCompetitor(filter);
        playSound('click');
    };

    const renderStatusBadge = (status: boolean | 'partial', note: string, isCashly = false) => {
        if (isCashly) {
            return (
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-emerald-700 stroke-[3]" />
                    </div>
                    <span>{note}</span>
                </div>
            );
        }

        if (status === true) {
            return (
                <div className="flex items-center gap-1.5 text-neutral-700 text-xs font-medium">
                    <Check size={14} className="text-emerald-600" />
                    <span>{note}</span>
                </div>
            );
        }

        if (status === 'partial') {
            return (
                <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium">
                    <span className="text-amber-500 font-bold">~</span>
                    <span>{note}</span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                <X size={14} className="text-neutral-300" />
                <span>{note}</span>
            </div>
        );
    };

    return (
        <section id="compare" className="landing-compare scroll-mt-20">
            <div className="landing-compare__container">
                <div className="landing-compare__header">
                    <div className="landing-compare__tag">
                        <span>●</span>
                        <span>THE SOVEREIGN DIFFERENCE</span>
                    </div>

                    <h2 className="landing-compare__title">
                        WHY CONSUMERS ARE<br />
                        MIGRATING TO CASHLY.
                    </h2>

                    <p className="landing-compare__sub">
                        Traditional personal finance tools rely on fragile bank aggregators that break every two weeks
                        and tell you about your spending days after it happened. Cashly is proactive, private, and deterministic.
                    </p>

                    {/* Filter Switcher */}
                    <div className="landing-compare__filters">
                        <button
                            type="button"
                            onClick={() => handleSelectFilter('all')}
                            className={`landing-compare__filter-btn ${selectedCompetitor === 'all' ? 'landing-compare__filter-btn--active' : ''}`}
                        >
                            Complete Matrix
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSelectFilter('ynab')}
                            className={`landing-compare__filter-btn ${selectedCompetitor === 'ynab' ? 'landing-compare__filter-btn--active' : ''}`}
                        >
                            vs YNAB
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSelectFilter('monarch')}
                            className={`landing-compare__filter-btn ${selectedCompetitor === 'monarch' ? 'landing-compare__filter-btn--active' : ''}`}
                        >
                            vs Monarch Money
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSelectFilter('banks')}
                            className={`landing-compare__filter-btn ${selectedCompetitor === 'banks' ? 'landing-compare__filter-btn--active' : ''}`}
                        >
                            vs Traditional Banks
                        </button>
                    </div>
                </div>

                {/* Comparison Table */}
                <div className="landing-compare__table-wrap">
                    <table className="landing-compare__table">
                        <thead>
                            <tr>
                                <th style={{ width: '38%' }}>Capabilities</th>
                                <th className="landing-compare__th--highlight" style={{ width: '22%' }}>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[var(--landing-orange)]" />
                                        <span>Cashly OS</span>
                                    </div>
                                </th>
                                {(selectedCompetitor === 'all' || selectedCompetitor === 'ynab') && (
                                    <th style={{ width: '13%' }}>YNAB</th>
                                )}
                                {(selectedCompetitor === 'all' || selectedCompetitor === 'monarch') && (
                                    <th style={{ width: '13%' }}>Monarch Money</th>
                                )}
                                {(selectedCompetitor === 'all' || selectedCompetitor === 'banks') && (
                                    <th style={{ width: '14%' }}>Legacy Banking</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARISONS.map((row, idx) => (
                                <tr key={row.feature} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}>
                                    <td className="landing-compare__feature-cell">
                                        <div className="font-bold text-neutral-900 text-sm">{row.feature}</div>
                                        <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{row.description}</div>
                                    </td>
                                    <td className="landing-compare__td--highlight">
                                        {renderStatusBadge(row.cashly.status, row.cashly.note, true)}
                                    </td>
                                    {(selectedCompetitor === 'all' || selectedCompetitor === 'ynab') && (
                                        <td>{renderStatusBadge(row.ynab.status, row.ynab.note)}</td>
                                    )}
                                    {(selectedCompetitor === 'all' || selectedCompetitor === 'monarch') && (
                                        <td>{renderStatusBadge(row.monarch.status, row.monarch.note)}</td>
                                    )}
                                    {(selectedCompetitor === 'all' || selectedCompetitor === 'banks') && (
                                        <td>{renderStatusBadge(row.banks.status, row.banks.note)}</td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Callout banner */}
                <div className="landing-compare__callout">
                    <div>
                        <div className="font-bold text-neutral-900 text-base">Ready to replace disconnected spreadsheets & fragile scrapers?</div>
                        <div className="text-xs text-neutral-600 mt-0.5">Experience zero-lag, sovereign personal finance in under 60 seconds.</div>
                    </div>
                    <Link to="/signup" className="landing-btn landing-btn--primary">
                        <span>Migrate to Cashly</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
