import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "./Footer";

/**
 * @param {{ title: string; subtitle?: string; children: import("react").ReactNode }} props
 */
export default function LegalPageShell({ title, subtitle, children }) {
  return (
    <div
      className="homepage-font theme-animate-surface flex min-h-dvh flex-col"
      style={{ background: "var(--homepage-gradient)" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "color-mix(in srgb, var(--homepage-cream) 92%, transparent)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--homepage-cream-border)",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "14px clamp(16px, 4vw, 28px)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brand-gold-muted)",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--brand-gold)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--brand-gold-muted)";
            }}
          >
            <ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
            Back to home
          </Link>
        </div>
      </div>

      <main className="flex-1" style={{ padding: "clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px)" }}>
        <article
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            padding: "clamp(24px, 4vw, 40px)",
            background: "var(--homepage-cream)",
            border: "1px solid var(--homepage-cream-border)",
            borderRadius: "18px",
            boxShadow: "0 16px 48px var(--homepage-card-shadow)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: "linear-gradient(90deg, transparent, var(--brand-gold) 25%, var(--brand-gold) 75%, transparent)",
            }}
          />
          <header style={{ marginBottom: "28px" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--brand-gold-muted)",
                margin: "0 0 10px 0",
              }}
            >
              North-cot
            </p>
            <h1
              style={{
                fontFamily: "'IBM Plex Serif', Georgia, serif",
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 700,
                fontStyle: "italic",
                color: "var(--text-primary)",
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p style={{ margin: "12px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>{subtitle}</p>
            ) : null}
          </header>
          <div
            className="legal-prose"
            style={{
              fontSize: "14px",
              lineHeight: 1.75,
              color: "var(--homepage-body-text)",
            }}
          >
            {children}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
