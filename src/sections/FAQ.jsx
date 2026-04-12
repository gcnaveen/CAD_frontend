import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";

const DEFAULT_ITEMS = [];

export default function FAQ() {
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.faq;
  const items = tr?.items?.length ? tr.items : DEFAULT_ITEMS;
  const [openIndex, setOpenIndex] = useState(0);
  const sectionRef = useRef(null);
  const baseId = useId();

  useEffect(() => {
    setOpenIndex(0);
  }, [lang]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const els = section.querySelectorAll(".faq-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, Number(el.dataset.delay || 0));
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      el.style.transition = "opacity 0.55s ease, transform 0.55s ease";
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [lang, items.length]);

  if (!items.length) return null;

  return (
    <section
      id="faq"
      ref={sectionRef}
      aria-labelledby={`${baseId}-heading`}
      style={{
        background: "var(--section-benefits-bg)",
        padding: "clamp(56px, 8vw, 96px) clamp(16px, 4vw, 32px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .faq-card {
          max-width: 720px;
          margin: 0 auto;
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(14px);
          border-radius: 22px;
          border: 1px solid rgba(201,168,76,0.2);
          box-shadow: 0 18px 48px rgba(0,0,0,0.08), 0 0 0 1px rgba(232,226,216,0.6);
          overflow: hidden;
        }
        .faq-row-btn {
          width: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          text-align: left;
          padding: 18px 20px;
          border: none;
          border-bottom: 1px solid rgba(232,226,216,0.85);
          background: transparent;
          cursor: pointer;
          font: inherit;
          color: var(--text-primary, #1a1a1a);
          transition: background 0.2s ease;
        }
        .faq-row-btn:hover {
          background: color-mix(in srgb, var(--brand-gold) 6%, transparent);
        }
        .faq-row-btn:focus-visible {
          outline: 2px solid var(--brand-gold);
          outline-offset: -2px;
        }
        .faq-row-btn[aria-expanded="true"] {
          background: color-mix(in srgb, var(--brand-gold) 8%, transparent);
        }
        .faq-q {
          font-weight: 650;
          font-size: clamp(15px, 2.1vw, 17px);
          line-height: 1.45;
        }
        .faq-chevron {
          flex-shrink: 0;
          color: var(--brand-gold-muted, #a68b3a);
          transition: transform 0.25s ease;
        }
        .faq-row-btn[aria-expanded="true"] .faq-chevron {
          transform: rotate(180deg);
        }
        .faq-panel {
          padding: 0 20px 18px 20px;
          border-bottom: 1px solid rgba(232,226,216,0.85);
          color: var(--text-secondary, #444);
          font-size: 15px;
          line-height: 1.65;
        }
        .faq-row:last-child .faq-row-btn { border-bottom: none; }
        .faq-row:last-child .faq-panel { border-bottom: none; }
      `}</style>

      <div className="faq-reveal" data-delay="0" style={{ maxWidth: "760px", margin: "0 auto 28px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--brand-gold-muted)",
            marginBottom: "10px",
          }}
        >
          {tr?.kicker || "FAQ"}
        </p>
        <h2
          id={`${baseId}-heading`}
          style={{
            fontSize: "clamp(1.55rem, 3.2vw, 2rem)",
            fontWeight: 800,
            lineHeight: 1.2,
            margin: "0 0 12px",
            color: "var(--text-primary)",
          }}
        >
          {tr?.title}
        </h2>
        {/* <p style={{ margin: 0, fontSize: "clamp(15px, 1.9vw, 17px)", lineHeight: 1.6, color: "var(--text-secondary)" }}>
          {tr?.subtitle}
        </p> */}
        {/* {tr?.langHint ? (
          <p
            style={{
              margin: "14px 0 0",
              fontSize: "13px",
              lineHeight: 1.5,
              color: "color-mix(in srgb, var(--text-secondary) 88%, var(--brand-gold))",
            }}
          >
            {tr.langHint}
          </p>
        ) : null} */}
      </div>

      <div className="faq-card faq-reveal" data-delay="80">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          const panelId = `${baseId}-panel-${i}`;
          const btnId = `${baseId}-btn-${i}`;
          return (
            <div key={i} className="faq-row">
              <button
                type="button"
                id={btnId}
                className="faq-row-btn"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
              >
                <span className="faq-q">{item.question}</span>
                <ChevronDown className="faq-chevron" size={22} strokeWidth={2.2} aria-hidden />
              </button>
              {isOpen ? (
                <div id={panelId} role="region" aria-labelledby={btnId} className="faq-panel">
                  {item.answer}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
