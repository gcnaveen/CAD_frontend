import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function BeforeAfterMedia({
  beforeSrc,
  afterSrc,
  beforeLabel,
  afterLabel,
  value,
  onValueChange,
  ariaLabel,
}) {
  const wrapRef = useRef(null);
  const dragging = useRef(false);

  const getPercent = (clientX) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return 50;
    return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      onValueChange(getPercent(e.clientX));
    };
    const onMouseUp = () => { dragging.current = false; };
    const onTouchMove = (e) => {
      if (!dragging.current) return;
      onValueChange(getPercent(e.touches[0].clientX));
    };
    const onTouchEnd = () => { dragging.current = false; };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onValueChange]);

  return (
    <div
      ref={wrapRef}
      className="ba-media"
      aria-label={ariaLabel}
      onMouseDown={(e) => {
        dragging.current = true;
        onValueChange(getPercent(e.clientX));
      }}
      onTouchStart={(e) => {
        dragging.current = true;
        onValueChange(getPercent(e.touches[0].clientX));
      }}
    >
      {/* BEFORE image — full size, sits beneath */}
      <img src={beforeSrc} alt="Before" className="ba-img ba-img--before" decoding="async" />

      {/* AFTER image — same full size, clipped via clipPath so it never shifts */}
      <img
        src={afterSrc}
        alt="After"
        className="ba-img ba-img--after"
        decoding="async"
        style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
      />

      {/* Divider line + handle */}
      <div className="ba-divider" style={{ left: `${value}%` }} aria-hidden="true">
        <div className="ba-divider-line" />
        <div className="ba-divider-handle">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M6 4L2 9L6 14" stroke="rgba(201,168,76,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 4L16 9L12 14" stroke="rgba(201,168,76,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="ba-pills" aria-hidden="true">
        <div className="ba-pill ba-pill--before">{beforeLabel}</div>
        <div className="ba-pill ba-pill--after">{afterLabel}</div>
      </div>
    </div>
  );
}

export default function BeforeAfterSection() {
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.beforeAfter;
  const sectionRef = useRef(null);

  const cards = useMemo(() => {
    const fallbackCards = [
      {
        key: "residential",
        title: "Residential Plot",
        caption:
          "A residential survey plot in Tumkur district — Tippani to clean AutoCAD boundary drawing.",
        afterSrc: "/assets/beforeafter/residential-before-CncuHBCP.jpg",
        beforeSrc: "/assets/beforeafter/residential-after-B4Pd_a8V.jpg",
      },
      {
        key: "partition",
        title: "Partition (Land Partition)",
        caption:
          "Partitioning a survey parcel — from hand-drawn notes to accurate AutoCAD layout.",
          afterSrc: "/assets/beforeafter/partition-before-DSD_eS2c.jpg",
          beforeSrc: "/assets/beforeafter/partition-after-C94SAZFl.jpg",
      },
      {
        key: "agricultural",
        title: "Agricultural Land",
        caption:
          "Agricultural survey documents — Tippani to professional AutoCAD drawing.",
          afterSrc: "/assets/beforeafter/agricultural-before-B1go6cYC.jpg",
          beforeSrc: "/assets/beforeafter/agricultural-after-B8JTnCQA.jpg",
      },
    ];

    const beforeAfterCards = tr?.cards;
    if (!beforeAfterCards) return fallbackCards;

    return ["residential", "partition", "agricultural"].map((key, i) => ({
      key,
      title: beforeAfterCards[key]?.title ?? fallbackCards[i].title,
      caption: beforeAfterCards[key]?.caption ?? fallbackCards[i].caption,
      beforeSrc: fallbackCards[i].beforeSrc,
      afterSrc: fallbackCards[i].afterSrc,
    }));
  }, [tr]);

  const [values, setValues] = useState({
    residential: 50,
    partition: 50,
    agricultural: 50,
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const nodes = section.querySelectorAll(".ba-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const d = Number(el.dataset.delay || 0);
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, d);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );

    nodes.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.65s ease, transform 0.65s ease";
      io.observe(el);
    });

    return () => io.disconnect();
  }, [lang]);

  return (
    <section
      id="before-after"
      ref={sectionRef}
      style={{
        background: "var(--section-cream-alt)",
        padding: "clamp(56px, 8vw, 100px) clamp(16px, 4vw, 32px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        /* ── Grid ── */
        .ba-grid {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(16px, 2.6vw, 28px);
        }
        @media (max-width: 980px) {
          .ba-grid { grid-template-columns: 1fr; }
        }

        /* ── Header ── */
        .ba-header {
          text-align: center;
          max-width: 720px;
          margin: 0 auto clamp(34px, 5vw, 56px);
          position: relative;
          z-index: 1;
        }
        .ba-kicker-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 18px;
          border-radius: 100px;
          background: rgba(201,168,76,0.12);
          border: 1px solid rgba(201,168,76,0.30);
          margin-bottom: 18px;
        }
        .ba-kicker-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--brand-gold);
          flex: 0 0 auto;
        }
        .ba-kicker-text {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--brand-gold-muted);
        }

        /* ── Media container ── */
        .ba-media {
          position: relative;
          width: 100%;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(232,226,216,0.70);
          background: rgba(255,255,255,0.72);
          box-shadow: 0 18px 48px rgba(0,0,0,0.08);
          height: clamp(240px, 30vw, 360px);
          cursor: ew-resize;
          user-select: none;
          -webkit-user-select: none;
        }
        html.dark .ba-media {
          background: rgba(15,23,42,0.55);
          border-color: rgba(51,65,85,0.70);
          box-shadow: 0 18px 48px rgba(0,0,0,0.28);
        }

        /* ── Images ──
             Both images are absolute, same size, same position.
             The after image uses clip-path so it never shifts — only reveals.
        */
        .ba-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          display: block;
        }
        .ba-img--after {
          /* clip-path is set inline via style prop; transition gives a smooth feel */
          transition: clip-path 0s; /* instant follow — remove if you want lag */
          z-index: 2;
        }

        /* ── Divider ── */
        .ba-divider {
          position: absolute;
          top: 0;
          height: 100%;
          transform: translateX(-50%);
          z-index: 4;
          pointer-events: none;
        }
        .ba-divider-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          transform: translateX(-50%);
          background: rgba(201,168,76,0.9);
        }
        .ba-divider-handle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid rgba(201,168,76,0.95);
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        html.dark .ba-divider-handle {
          background: #1e293b;
        }

        /* ── Pills ── */
        .ba-pills {
          position: absolute;
          top: 14px;
          left: 14px;
          right: 14px;
          z-index: 5;
          display: flex;
          justify-content: space-between;
          pointer-events: none;
          gap: 10px;
        }
        .ba-pill {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(15,23,42,0.60);
          color: rgba(248,250,252,0.95);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.12);
          max-width: 46%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-transform: uppercase;
        }
        html.dark .ba-pill {
          background: rgba(2,6,23,0.65);
        }

        /* ── Card ── */
        .ba-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ba-card-title {
          font-family: 'IBM Plex Serif', Georgia, serif;
          font-style: italic;
          font-weight: 700;
          font-size: 18px;
          color: var(--brand-green-deep);
          margin: 0;
        }
        .ba-card-caption {
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-brown-muted);
          margin: 0;
        }

        /* ── Reveal animation ── */
        .ba-reveal {
          opacity: 0;
          transform: translateY(20px);
        }

        /* ── Background grid ── */
        .ba-bg-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(201,168,76,0.15) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.38;
          pointer-events: none;
        }
      `}</style>

      <div className="ba-bg-grid" aria-hidden="true" />

      <div className="ba-header ba-reveal" data-delay="0">
        <div className="ba-kicker-pill" aria-hidden="true">
          <span className="ba-kicker-dot" />
          <span className="ba-kicker-text">{tr?.kicker || "Before & After"}</span>
        </div>
        <h2
          className="home-serif-title"
          style={{
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: "clamp(28px, 3.8vw, 52px)",
            lineHeight: 1.15,
            background: "var(--hero-panel-bg)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: 14,
            letterSpacing: "-0.01em",
          }}
        >
          {tr?.title || "Before & After: AutoCAD Drawings"}
        </h2>
        <p
          style={{
            fontSize: "clamp(14px, 1.1vw, 16px)",
            color: "var(--text-brown-muted)",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          {tr?.subtitle ||
            "See how hand-drawn survey sketches become professional AutoCAD drawings through North-cot."}
        </p>
      </div>

      <div className="ba-grid">
        {cards.map((c, idx) => {
          const beforeLabel =
            tr?.beforeAfterLabels?.before ?? tr?.beforeLabel ?? "Before";
          const afterLabel =
            tr?.beforeAfterLabels?.after ?? tr?.afterLabel ?? "After";

          return (
            <div
              key={c.key}
              className="ba-card ba-reveal"
              data-delay={String(70 + idx * 80)}
            >
              <BeforeAfterMedia
                beforeSrc={c.beforeSrc}
                afterSrc={c.afterSrc}
                beforeLabel={beforeLabel}
                afterLabel={afterLabel}
                value={values[c.key] ?? 50}
                onValueChange={(next) =>
                  setValues((p) => ({ ...p, [c.key]: next }))
                }
                ariaLabel={`Before and after slider for ${c.title}`}
              />
              <h3 className="ba-card-title">{c.title}</h3>
              <p className="ba-card-caption">{c.caption}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}