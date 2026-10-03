import { Key, Database, Lock, Server, ShieldCheck, Check } from 'lucide-react';

const ARCHITECTURE_LAYERS = [
    {
        icon: Key,
        code: 'LAYER 01 / CLIENT',
        title: 'Zero Bank Credentials Stored',
        spec: 'Direct DOM Interception',
        description: 'Cashly never asks for, stores, or transmits your online banking username, password, or security questions. Purchases are captured locally from completed checkout sessions in your browser.',
        details: ['Zero screen scrapers', 'No banking credentials on disk', 'Local checkout parsing']
    },
    {
        icon: Database,
        code: 'LAYER 02 / STORAGE',
        title: 'Postgres Row-Level Security (RLS)',
        spec: 'Database-Level Isolation',
        description: 'Multi-tenant isolation is enforced at the PostgreSQL database engine layer. Every query is filtered by auth.uid(). No user can read, query, or modify another tenant’s rows under any circumstance.',
        details: ['PostgreSQL RLS policies', 'Hardware-backed encryption at rest', 'Strict tenant boundaries']
    },
    {
        icon: Lock,
        code: 'LAYER 03 / TRANSPORT',
        title: 'Cryptographic JWT Handshake',
        spec: 'HMAC / RSA Authenticated Tokens',
        description: 'Every interaction between the browser companion, web application, and backend API requires cryptographically signed JSON Web Tokens with strict expiration windows and automated refresh cycles.',
        details: ['Signed bearer tokens', 'HTTPS TLS 1.3 in transit', 'CSRF and replay protection']
    },
    {
        icon: Server,
        code: 'LAYER 04 / COMPUTE',
        title: 'Server-Side Compute Isolation',
        spec: 'Zero Client Secret Exposure',
        description: 'AI pattern detection, financial modeling, and statement OCR extraction execute on protected server infrastructure. Secrets and private keys are never shipped in client-side JavaScript bundles.',
        details: ['Ephemeral OCR processing', 'Zero client key leakage', 'Audited server endpoints']
    }
];

export default function TrustArchitectureVisual() {
    return (
        <div className="space-y-12">
            {/* Architectural Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ARCHITECTURE_LAYERS.map((layer) => {
                    const Icon = layer.icon;
                    return (
                        <div
                            key={layer.code}
                            className="flex flex-col justify-between rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-2xs transition-all hover:border-[#D6D3D1]"
                        >
                            <div>
                                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 text-xs">
                                    <span className="font-mono text-[10px] font-bold tracking-wider text-[var(--color-brand)]">
                                        {layer.code}
                                    </span>
                                    <Icon className="h-4 w-4 text-[#8C9B9E]" />
                                </div>

                                <h4 className="mt-4 font-display text-base font-bold text-[#142127]">
                                    {layer.title}
                                </h4>

                                <p className="mt-1 font-mono text-[11px] font-semibold text-[#17824F]">
                                    {layer.spec}
                                </p>

                                <p className="mt-3 text-xs leading-relaxed text-[#57534E]">
                                    {layer.description}
                                </p>
                            </div>

                            <div className="mt-6 pt-3 border-t border-[#E7E5E4] space-y-1.5">
                                {layer.details.map((detail, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[11px] text-[#78716C]">
                                        <Check className="h-3 w-3 text-[#059669] shrink-0" />
                                        <span>{detail}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Architectural Trust Summary Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#E7E5E4] bg-white px-6 py-4 text-xs text-[#78716C]">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#059669]" />
                    <span className="font-medium text-[#1C1917]">
                        Verified Cryptographic Integrity • Independent Postgres RLS Audited
                    </span>
                </div>
                <span className="font-mono text-[11px] text-[#A8A29E]">
                    Calm Finance Architecture Standard 2026
                </span>
            </div>
        </div>
    );
}
