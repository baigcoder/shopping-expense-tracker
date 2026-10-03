/**
 * Architectural Isometric 3D Blocks Scene
 * Recreates the iconic tactile white architectural blocks from the reference art direction.
 * Rendered using precision SVG isometric projection with directional lighting, gradients,
 * and ambient occlusion shadows for zero-latency, razor-sharp rendering at all resolutions.
 */
export default function ArchitecturalBlocksScene({ className = '' }: { className?: string }) {
    const c30 = Math.cos(Math.PI / 6);
    const s30 = Math.sin(Math.PI / 6);

    const ox = 195;
    const oy = 150;

    const pt = (x: number, y: number, z: number) => {
        const sx = ox + (x - y) * c30;
        const sy = oy + (x + y) * s30 - z;
        return `${Math.round(sx * 10) / 10},${Math.round(sy * 10) / 10}`;
    };

    // Isometric block definitions positioned to match reference composition
    const blocks = [
        // Background tall pillars
        { id: 'b1', x: -60, y: -70, z: 0, sx: 54, sy: 54, sz: 165 },
        { id: 'b2', x: 0, y: -100, z: 0, sx: 48, sy: 48, sz: 175 },
        { id: 'b3', x: 50, y: -65, z: 0, sx: 56, sy: 56, sz: 140 },
        { id: 'b4', x: -110, y: -20, z: 0, sx: 46, sy: 46, sz: 125 },

        // Midground geometric blocks
        { id: 'b5', x: -40, y: -5, z: 0, sx: 62, sy: 62, sz: 110 },
        { id: 'b6', x: 25, y: -15, z: 0, sx: 58, sy: 58, sz: 100 },
        { id: 'b7', x: 90, y: -10, z: 0, sx: 50, sy: 50, sz: 85 },
        { id: 'b8', x: -90, y: 35, z: 0, sx: 52, sy: 52, sz: 80 },

        // Foreground featured cubes
        { id: 'b9', x: -20, y: 55, z: 0, sx: 68, sy: 68, sz: 82 },
        { id: 'b10', x: 55, y: 45, z: 0, sx: 60, sy: 60, sz: 70 },
        { id: 'b11', x: 120, y: 40, z: 0, sx: 48, sy: 48, sz: 55 },

        // Foreground low step slabs
        { id: 'b12', x: -50, y: 115, z: 0, sx: 56, sy: 56, sz: 45 },
        { id: 'b13', x: 15, y: 110, z: 0, sx: 62, sy: 62, sz: 38 },
        { id: 'b14', x: 80, y: 95, z: 0, sx: 50, sy: 50, sz: 30 },
    ];

    // Painter's sort: render furthest blocks first
    const sorted = [...blocks].sort((a, b) => (a.x + a.y) - (b.x + b.y));

    return (
        <div className={`landing-hero__photo-container ${className}`} style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            background: 'linear-gradient(180deg, #E6E6E9 0%, #D8D9DE 100%)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <svg
                viewBox="0 0 390 260"
                style={{ width: '100%', height: '100%', display: 'block' }}
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    {/* Shadow blur filter */}
                    <filter id="blockShadow" x="-20%" y="-20%" width="150%" height="150%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
                        <feColorMatrix type="matrix" values="0 0 0 0 0.1   0 0 0 0 0.12   0 0 0 0 0.18   0 0 0 0.28 0" />
                        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                    </filter>

                    <filter id="softContactShadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="8" />
                    </filter>

                    {/* Top Face Gradient: Crisp White Plaster */}
                    <linearGradient id="topFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="70%" stopColor="#F9F9FA" />
                        <stop offset="100%" stopColor="#F0F1F4" />
                    </linearGradient>

                    {/* Left Face Gradient: Soft Silver-Grey Plaster */}
                    <linearGradient id="leftFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E4E5EB" />
                        <stop offset="100%" stopColor="#D5D6DE" />
                    </linearGradient>

                    {/* Right Face Gradient: Shaded Studio Grey */}
                    <linearGradient id="rightFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#BDBEC8" />
                        <stop offset="100%" stopColor="#A8AAB5" />
                    </linearGradient>

                    {/* Ambient Ground Gradient */}
                    <radialGradient id="groundGlow" cx="45%" cy="45%" r="65%">
                        <stop offset="0%" stopColor="#ECECEF" />
                        <stop offset="70%" stopColor="#DFE0E5" />
                        <stop offset="100%" stopColor="#CFD0D7" />
                    </radialGradient>
                </defs>

                {/* Ground plane */}
                <rect width="390" height="260" fill="url(#groundGlow)" />

                {/* Cast Shadows Under Blocks */}
                <g filter="url(#softContactShadow)" opacity="0.35">
                    {sorted.map((b) => {
                        const s0 = pt(b.x, b.y, 0);
                        const s1 = pt(b.x + b.sx + 20, b.y + 10, 0);
                        const s2 = pt(b.x + b.sx + 35, b.y + b.sy + 25, 0);
                        const s3 = pt(b.x + 10, b.y + b.sy + 20, 0);
                        return (
                            <polygon
                                key={`sh-${b.id}`}
                                points={`${s0} ${s1} ${s2} ${s3}`}
                                fill="#2A2C35"
                            />
                        );
                    })}
                </g>

                {/* 3D Isometric Blocks */}
                {sorted.map((b) => {
                    const { x, y, z = 0, sx, sy, sz, id } = b;

                    // Vertices for Top Face (z + sz)
                    const t0 = pt(x, y, z + sz);
                    const t1 = pt(x + sx, y, z + sz);
                    const t2 = pt(x + sx, y + sy, z + sz);
                    const t3 = pt(x, y + sy, z + sz);

                    // Vertices for Left Face
                    const l0 = pt(x, y + sy, z + sz);
                    const l1 = pt(x + sx, y + sy, z + sz);
                    const l2 = pt(x + sx, y + sy, z);
                    const l3 = pt(x, y + sy, z);

                    // Vertices for Right Face
                    const r0 = pt(x + sx, y, z + sz);
                    const r1 = pt(x + sx, y + sy, z + sz);
                    const r2 = pt(x + sx, y + sy, z);
                    const r3 = pt(x + sx, y, z);

                    return (
                        <g key={id} className="iso-block">
                            {/* Left Face (light-facing) */}
                            <polygon
                                points={`${l0} ${l1} ${l2} ${l3}`}
                                fill="url(#leftFaceGrad)"
                                stroke="rgba(255,255,255,0.25)"
                                strokeWidth="0.5"
                            />

                            {/* Right Face (shadow-facing) */}
                            <polygon
                                points={`${r0} ${r1} ${r2} ${r3}`}
                                fill="url(#rightFaceGrad)"
                                stroke="rgba(0,0,0,0.06)"
                                strokeWidth="0.5"
                            />

                            {/* Top Face (brightest highlight) */}
                            <polygon
                                points={`${t0} ${t1} ${t2} ${t3}`}
                                fill="url(#topFaceGrad)"
                                stroke="rgba(255,255,255,0.7)"
                                strokeWidth="0.75"
                            />

                            {/* Highlight bevel on top edge */}
                            <line
                                x1={t0.split(',')[0]}
                                y1={t0.split(',')[1]}
                                x2={t1.split(',')[0]}
                                y2={t1.split(',')[1]}
                                stroke="rgba(255,255,255,0.9)"
                                strokeWidth="0.8"
                            />
                        </g>
                    );
                })}

                {/* Subtle vignette border at top */}
                <rect width="390" height="260" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
            </svg>
        </div>
    );
}
