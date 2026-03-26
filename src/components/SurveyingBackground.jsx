import React, { useRef } from "react";

// Surveying-themed animated SVG background
// Matches the warm parchment/gold/forest-green palette of the Hero component

const SurveyingBackground = () => {
  const svgRef = useRef(null);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ zIndex: 1 }}
    >
      <style>{`
        /* ── Grid fade-in ── */
        @keyframes gridFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        /* ── Dash trace: survey lines drawing themselves ── */
        @keyframes drawLine {
          0%   { stroke-dashoffset: 1000; opacity: 0; }
          10%  { opacity: 1; }
          60%  { stroke-dashoffset: 0; opacity: 1; }
          85%  { opacity: 0.5; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }

        /* ── Triangulation fill pulse ── */
        @keyframes triPulse {
          0%   { opacity: 0; }
          30%  { opacity: 0.08; }
          60%  { opacity: 0.04; }
          100% { opacity: 0; }
        }

        /* ── Crosshair spin ── */
        @keyframes crossSpin {
          0%   { transform: rotate(0deg);   opacity: 0; }
          10%  { opacity: 0.9; }
          90%  { opacity: 0.9; }
          100% { transform: rotate(90deg);  opacity: 0; }
        }

        /* ── Theodolite scope rotate ── */
        @keyframes scopeRotate {
          0%   { transform: rotate(-20deg); opacity: 0; }
          15%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: rotate(20deg);  opacity: 0; }
        }

        /* ── Ping ripple at survey point ── */
        @keyframes surveyPing {
          0%   { r: 2px;  opacity: 0.9; }
          100% { r: 18px; opacity: 0; }
        }

        /* ── Coordinate label blink ── */
        @keyframes labelBlink {
          0%, 100% { opacity: 0; }
          40%, 70% { opacity: 0.55; }
        }

        /* ── Contour line slow drift ── */
        @keyframes contourDrift {
          0%   { stroke-dashoffset: 0;   opacity: 0.06; }
          50%  { opacity: 0.11; }
          100% { stroke-dashoffset: 120; opacity: 0.06; }
        }

        /* ── Elevation tick float ── */
        @keyframes tickFloat {
          0%   { transform: translateY(0px);  opacity: 0; }
          20%  { opacity: 0.6; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(-12px); opacity: 0; }
        }

        /* ─ individual animation declarations ─ */
        .sv-grid       { animation: gridFade 2s ease forwards; }

        .sv-line-1     { stroke-dasharray: 1000; animation: drawLine 6s ease-in-out 0.5s infinite; }
        .sv-line-2     { stroke-dasharray: 1000; animation: drawLine 7s ease-in-out 1.8s infinite; }
        .sv-line-3     { stroke-dasharray: 1000; animation: drawLine 5.5s ease-in-out 3.2s infinite; }
        .sv-line-4     { stroke-dasharray: 1000; animation: drawLine 8s ease-in-out 0.9s infinite; }
        .sv-line-5     { stroke-dasharray: 1000; animation: drawLine 6.5s ease-in-out 4.1s infinite; }
        .sv-line-6     { stroke-dasharray: 1000; animation: drawLine 7.5s ease-in-out 2.6s infinite; }

        .sv-tri-1      { animation: triPulse 6s ease-in-out 1s infinite; }
        .sv-tri-2      { animation: triPulse 7s ease-in-out 3s infinite; }
        .sv-tri-3      { animation: triPulse 5.5s ease-in-out 5s infinite; }

        .sv-cross-1    { transform-origin: 120px 180px; animation: crossSpin 8s ease-in-out 0s infinite; }
        .sv-cross-2    { transform-origin: 680px 320px; animation: crossSpin 9s ease-in-out 2s infinite; }
        .sv-cross-3    { transform-origin: 900px 500px; animation: crossSpin 7s ease-in-out 4s infinite; }

        .sv-scope      { transform-origin: 400px 240px; animation: scopeRotate 9s ease-in-out 1s infinite; }

        .sv-ping-1     { animation: surveyPing 2.5s ease-out 0.5s infinite; }
        .sv-ping-2     { animation: surveyPing 2.5s ease-out 2.0s infinite; }
        .sv-ping-3     { animation: surveyPing 2.5s ease-out 3.7s infinite; }
        .sv-ping-4     { animation: surveyPing 2.5s ease-out 5.2s infinite; }

        .sv-label-1    { animation: labelBlink 5s ease-in-out 1s infinite; }
        .sv-label-2    { animation: labelBlink 6s ease-in-out 2.5s infinite; }
        .sv-label-3    { animation: labelBlink 4.5s ease-in-out 4s infinite; }

        .sv-contour-1  { stroke-dasharray: 18 10; animation: contourDrift 12s linear infinite; }
        .sv-contour-2  { stroke-dasharray: 18 10; animation: contourDrift 15s linear 3s infinite; }
        .sv-contour-3  { stroke-dasharray: 18 10; animation: contourDrift 10s linear 6s infinite; }

        .sv-tick-1     { transform-origin: 260px 400px; animation: tickFloat 5s ease-in-out 1s infinite; }
        .sv-tick-2     { transform-origin: 750px 280px; animation: tickFloat 6s ease-in-out 3s infinite; }
      `}</style>

      <svg
        ref={svgRef}
        viewBox="0 0 1200 700"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ─────────────────────────────────────────────
            LAYER 1: Fine survey grid (faint, warm tone)
        ───────────────────────────────────────────── */}
        <g className="sv-grid">
          {/* Horizontal grid lines */}
          {Array.from({ length: 14 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0" y1={i * 52} x2="1200" y2={i * 52}
              stroke="rgba(201,168,76,0.055)" strokeWidth="0.8"
            />
          ))}
          {/* Vertical grid lines */}
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 52} y1="0" x2={i * 52} y2="700"
              stroke="rgba(201,168,76,0.055)" strokeWidth="0.8"
            />
          ))}
          {/* Tick marks at intersections (sparse) */}
          {[104, 260, 416, 572, 728, 884, 1040].map((x) =>
            [104, 208, 364, 520].map((y) => (
              <g key={`tick-${x}-${y}`}>
                <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="rgba(201,168,76,0.18)" strokeWidth="0.7" />
                <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="rgba(201,168,76,0.18)" strokeWidth="0.7" />
              </g>
            ))
          )}
        </g>

        {/* ─────────────────────────────────────────────
            LAYER 2: Contour / topographic lines
        ───────────────────────────────────────────── */}
        {/* Contour line 1 — irregular closed path */}
        <path
          className="sv-contour-1"
          d="M 80 380 Q 200 320 380 350 Q 520 370 620 310 Q 740 250 860 300 Q 980 345 1100 290"
          fill="none" stroke="rgba(21,40,21,0.09)" strokeWidth="1.2"
        />
        {/* Contour line 2 */}
        <path
          className="sv-contour-2"
          d="M 0 450 Q 160 410 320 440 Q 480 470 640 420 Q 800 370 960 410 Q 1080 440 1200 400"
          fill="none" stroke="rgba(21,40,21,0.07)" strokeWidth="1"
        />
        {/* Contour line 3 */}
        <path
          className="sv-contour-3"
          d="M 60 560 Q 220 520 400 545 Q 580 565 720 510 Q 880 455 1040 500 Q 1120 520 1200 490"
          fill="none" stroke="rgba(21,40,21,0.08)" strokeWidth="0.9"
        />

        {/* ─────────────────────────────────────────────
            LAYER 3: Triangulation network lines
        ───────────────────────────────────────────── */}
        {/* Baseline triangle - left zone */}
        <line className="sv-line-1" x1="120" y1="180" x2="380" y2="420" stroke="rgba(201,168,76,0.35)" strokeWidth="1.2" />
        <line className="sv-line-2" x1="380" y1="420" x2="220" y2="520" stroke="rgba(201,168,76,0.30)" strokeWidth="1" />
        <line className="sv-line-3" x1="220" y1="520" x2="120" y2="180" stroke="rgba(201,168,76,0.25)" strokeWidth="1" />

        {/* Right zone triangulation */}
        <line className="sv-line-4" x1="680" y1="140" x2="920" y2="380" stroke="rgba(21,40,21,0.22)" strokeWidth="1.2" />
        <line className="sv-line-5" x1="920" y1="380" x2="1080" y2="220" stroke="rgba(21,40,21,0.18)" strokeWidth="1" />
        <line className="sv-line-6" x1="1080" y1="220" x2="680" y2="140" stroke="rgba(21,40,21,0.20)" strokeWidth="0.9" />

        {/* Cross diagonal — long survey baseline */}
        <line className="sv-line-1" x1="80" y1="600" x2="1150" y2="100" stroke="rgba(201,168,76,0.15)" strokeWidth="0.8" />
        <line className="sv-line-3" x1="400" y1="60" x2="850" y2="640" stroke="rgba(201,168,76,0.12)" strokeWidth="0.8" />

        {/* ─────────────────────────────────────────────
            LAYER 4: Triangulation fill polygons
        ───────────────────────────────────────────── */}
        <polygon className="sv-tri-1" points="120,180 380,420 220,520" fill="rgba(201,168,76,0.12)" />
        <polygon className="sv-tri-2" points="680,140 920,380 1080,220" fill="rgba(21,40,21,0.07)" />
        <polygon className="sv-tri-3" points="380,420 620,500 450,620" fill="rgba(201,168,76,0.08)" />

        {/* ─────────────────────────────────────────────
            LAYER 5: Survey station crosshairs
        ───────────────────────────────────────────── */}
        {/* Station 1 at (120, 180) */}
        <g className="sv-cross-1">
          <line x1="112" y1="180" x2="128" y2="180" stroke="rgba(201,168,76,0.7)" strokeWidth="1.5" />
          <line x1="120" y1="172" x2="120" y2="188" stroke="rgba(201,168,76,0.7)" strokeWidth="1.5" />
          <circle cx="120" cy="180" r="5" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1" />
          <circle cx="120" cy="180" r="9" fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="0.8" strokeDasharray="3 3" />
        </g>

        {/* Station 2 at (680, 320) */}
        <g className="sv-cross-2">
          <line x1="672" y1="320" x2="688" y2="320" stroke="rgba(201,168,76,0.7)" strokeWidth="1.5" />
          <line x1="680" y1="312" x2="680" y2="328" stroke="rgba(201,168,76,0.7)" strokeWidth="1.5" />
          <circle cx="680" cy="320" r="5" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1" />
          <circle cx="680" cy="320" r="9" fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="0.8" strokeDasharray="3 3" />
        </g>

        {/* Station 3 at (900, 500) */}
        <g className="sv-cross-3">
          <line x1="892" y1="500" x2="908" y2="500" stroke="rgba(21,40,21,0.5)" strokeWidth="1.5" />
          <line x1="900" y1="492" x2="900" y2="508" stroke="rgba(21,40,21,0.5)" strokeWidth="1.5" />
          <circle cx="900" cy="500" r="5" fill="none" stroke="rgba(21,40,21,0.4)" strokeWidth="1" />
          <circle cx="900" cy="500" r="9" fill="none" stroke="rgba(21,40,21,0.15)" strokeWidth="0.8" strokeDasharray="3 3" />
        </g>

        {/* ─────────────────────────────────────────────
            LAYER 6: Theodolite scope (circle + aimline)
        ───────────────────────────────────────────── */}
        <g className="sv-scope">
          {/* Outer ring */}
          <circle cx="400" cy="240" r="28" fill="none" stroke="rgba(201,168,76,0.35)" strokeWidth="1.2" />
          {/* Inner ring */}
          <circle cx="400" cy="240" r="18" fill="none" stroke="rgba(201,168,76,0.25)" strokeWidth="0.9" />
          {/* Center dot */}
          <circle cx="400" cy="240" r="2.5" fill="rgba(201,168,76,0.5)" />
          {/* Cross hairs inside scope */}
          <line x1="374" y1="240" x2="394" y2="240" stroke="rgba(201,168,76,0.45)" strokeWidth="0.9" />
          <line x1="406" y1="240" x2="426" y2="240" stroke="rgba(201,168,76,0.45)" strokeWidth="0.9" />
          <line x1="400" y1="214" x2="400" y2="234" stroke="rgba(201,168,76,0.45)" strokeWidth="0.9" />
          <line x1="400" y1="246" x2="400" y2="266" stroke="rgba(201,168,76,0.45)" strokeWidth="0.9" />
          {/* Degree tick marks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const r1 = 26, r2 = 23;
            const x1 = 400 + r1 * Math.cos(angle), y1 = 240 + r1 * Math.sin(angle);
            const x2 = 400 + r2 * Math.cos(angle), y2 = 240 + r2 * Math.sin(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />;
          })}
          {/* Sighting arm extending out */}
          <line x1="400" y1="240" x2="500" y2="160" stroke="rgba(201,168,76,0.25)" strokeWidth="0.9" strokeDasharray="5 4" />
        </g>

        {/* ─────────────────────────────────────────────
            LAYER 7: Ripple pings at survey nodes
        ───────────────────────────────────────────── */}
        <circle className="sv-ping-1" cx="120" cy="180" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1" />
        <circle className="sv-ping-2" cx="380" cy="420" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="1" />
        <circle className="sv-ping-3" cx="680" cy="320" fill="none" stroke="rgba(21,40,21,0.35)" strokeWidth="1" />
        <circle className="sv-ping-4" cx="900" cy="500" fill="none" stroke="rgba(21,40,21,0.3)" strokeWidth="1" />

        {/* ─────────────────────────────────────────────
            LAYER 8: Coordinate / boundary labels
        ───────────────────────────────────────────── */}
        <g className="sv-label-1" fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill="rgba(201,168,76,0.7)" letterSpacing="0.08em">
          <text x="128" y="174">N 12°58′24″</text>
          <text x="128" y="184">E 77°35′16″</text>
        </g>
        <g className="sv-label-2" fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill="rgba(21,40,21,0.5)" letterSpacing="0.08em">
          <text x="688" y="314">N 12°58′41″</text>
          <text x="688" y="324">E 77°35′52″</text>
        </g>
        <g className="sv-label-3" fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill="rgba(21,40,21,0.45)" letterSpacing="0.08em">
          <text x="908" y="494">BENCHMARK</text>
          <text x="908" y="504">EL. 915.3m</text>
        </g>

        {/* ─────────────────────────────────────────────
            LAYER 9: Elevation tick markers
        ───────────────────────────────────────────── */}
        <g className="sv-tick-1">
          {/* Small staff gauge */}
          <line x1="260" y1="385" x2="260" y2="415" stroke="rgba(201,168,76,0.5)" strokeWidth="1.2" />
          {[390, 395, 400, 405, 410].map((y, i) => (
            <line key={y} x1={i % 2 === 0 ? 256 : 258} y1={y} x2="260" y2={y} stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
          ))}
          <text x="263" y="398" fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="rgba(201,168,76,0.5)">913m</text>
        </g>
        <g className="sv-tick-2">
          <line x1="750" y1="265" x2="750" y2="295" stroke="rgba(21,40,21,0.4)" strokeWidth="1.2" />
          {[270, 275, 280, 285, 290].map((y, i) => (
            <line key={y} x1={i % 2 === 0 ? 746 : 748} y1={y} x2="750" y2={y} stroke="rgba(21,40,21,0.35)" strokeWidth="0.8" />
          ))}
          <text x="753" y="278" fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="rgba(21,40,21,0.4)">920m</text>
        </g>

        {/* ─────────────────────────────────────────────
            LAYER 10: Land parcel boundary (static, faint)
        ───────────────────────────────────────────── */}
        <polygon
          points="120,180 380,420 620,500 850,460 1080,220 780,80 480,60"
          fill="none"
          stroke="rgba(21,40,21,0.09)"
          strokeWidth="1.5"
          strokeDasharray="12 8"
        />
        {/* North arrow (top right corner) */}
        <g transform="translate(1120, 60)" opacity="0.25" style={{ color: "var(--brand-green-deep)" }}>
          <line x1="0" y1="30" x2="0" y2="-30" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="0,-30 -5,-18 0,-22 5,-18" fill="currentColor" />
          <text x="4" y="-20" fontFamily="'IBM Plex Mono', monospace" fontSize="10" fill="currentColor" fontWeight="700">N</text>
          <circle cx="0" cy="0" r="14" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </g>

        {/* Scale bar (bottom right) */}
        <g transform="translate(980, 650)" opacity="0.22" style={{ color: "var(--brand-green-deep)" }}>
          <line x1="0" y1="0" x2="120" y2="0" stroke="currentColor" strokeWidth="1.2" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke="currentColor" strokeWidth="1.2" />
          <line x1="60" y1="-4" x2="60" y2="4" stroke="currentColor" strokeWidth="1.2" />
          <line x1="120" y1="-4" x2="120" y2="4" stroke="currentColor" strokeWidth="1.2" />
          <text x="22" y="-7" fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="currentColor">50m</text>
          <text x="82" y="-7" fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="currentColor">100m</text>
        </g>
      </svg>
    </div>
  );
};

export default SurveyingBackground;