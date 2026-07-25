import React from "react";
import { Link, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { getRedirectForRole } from "../utils/authRedirect";
import { resolveStoredUserRole } from "../constants/roles";

/**
 * Bare 403 page — no admin / CAD / surveyor shell chrome.
 */
export default function ForbiddenPage() {
  const location = useLocation();
  const from =
    location.state?.from ||
    (typeof location.state === "string" ? location.state : null);
  const role = useSelector((state) =>
    resolveStoredUserRole(state.auth?.role, state.auth?.user?.role)
  );
  const home = getRedirectForRole(role);

  return (
    <div
      className="homepage-font theme-animate-surface flex min-h-dvh flex-col items-center justify-center"
      style={{
        background: "var(--homepage-gradient)",
        padding: "clamp(24px, 5vw, 48px)",
      }}
      data-testid="forbidden-page"
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          padding: "clamp(28px, 4vw, 40px)",
          background: "var(--homepage-cream)",
          border: "1px solid var(--homepage-cream-border)",
          borderRadius: 18,
          boxShadow: "0 16px 48px var(--homepage-card-shadow)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--brand-gold-muted)",
          }}
        >
          403
        </p>
        <h1
          style={{
            margin: "12px 0 8px",
            fontSize: "clamp(1.5rem, 3vw, 1.85rem)",
            fontWeight: 700,
            color: "var(--brand-green)",
          }}
        >
          Access denied
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 15,
            lineHeight: 1.55,
            color: "var(--homepage-nav-muted)",
          }}
        >
          Your account does not have permission to view this page
          {from ? (
            <>
              {" "}
              (<code style={{ fontSize: 13 }}>{from}</code>)
            </>
          ) : null}
          .
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <Link
            to={home && home !== "/" ? home : "/"}
            replace
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 18px",
              borderRadius: 10,
              background: "var(--brand-green)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Go to your home
          </Link>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid var(--homepage-cream-border)",
              color: "var(--brand-green)",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              background: "transparent",
            }}
          >
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
