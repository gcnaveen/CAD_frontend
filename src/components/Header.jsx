import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setLanguage } from "../features/i18n/languageSlice";
import { t } from "../constants/translation";
import { useTheme } from "../theme/useTheme.js";
import { ArrowUpRight } from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";
import InstallButton from "./pwa/InstallButton.jsx";
import { getRedirectForRole } from "../utils/authRedirect.js";
import { resolveStoredUserRole } from "../constants/roles.js";

const FALLBACK_LOGO = "/assets/logo.webp";
const FALLBACK_LOGO_PNG = "/assets/logo.png";

const NAV_LINKS = [
  { key: "header.nav.howItWorks", section: "how-it-works" },
  { key: "header.nav.benefits", section: "benefits" },
  { key: "header.nav.testimonials", section: "testimonials" },
  { key: "header.nav.faq", section: "faq" },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.language?.lang || "en");
  const authToken = useSelector((state) => state.auth?.token);
  const authRole = useSelector((state) =>
    resolveStoredUserRole(state.auth?.role, state.auth?.user?.role),
  );
  const isLoggedIn = Boolean(authToken);
  const { resolvedTheme } = useTheme();

  const logoSrc =
    resolvedTheme === "dark" ? FALLBACK_LOGO : "/assets/logoblack.webp";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLoginClick = () => {
    const dest = isLoggedIn ? getRedirectForRole(authRole) : "/login";
    setIsMobileMenuOpen(false);
    navigate(dest);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <style>{`
        .nav-link-header {
          position: relative;
          font-size: 13px;
          font-weight: 500;
          color: var(--homepage-nav-muted);
          letter-spacing: 0.02em;
          transition: color 0.2s ease;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 0;
        }
        .nav-link-header::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0; right: 0;
          height: 1.5px;
          background: var(--brand-gold);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease;
        }
        .nav-link-header:hover {
          color: var(--brand-green);
        }
        .nav-link-header:hover::after {
          transform: scaleX(1);
        }
        .lang-btn-active {
          background: var(--bg-elevated);
          color: var(--brand-green);
          font-weight: 600;
          box-shadow: 0 1px 4px var(--homepage-card-shadow);
        }
        .lang-btn-inactive {
          background: transparent;
          color: var(--homepage-nav-muted);
          font-weight: 500;
        }
        .header-cta-btn {
          transition: all 0.2s ease;
        }
        .header-cta-btn:hover {
          background: color-mix(in srgb, var(--brand-green) 92%, black) !important;
          box-shadow: 0 10px 28px var(--homepage-card-shadow) !important;
        }
        @media (max-width: 1023px) {
          .desktop-nav { display: none !important; }
          .mobile-bar-controls { display: flex !important; align-items: center; gap: 8px; flex-shrink: 0; }
        }
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .mobile-bar-controls { display: none !important; }
        }
      `}</style>

      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: "all 0.3s ease",
        }}
      >
        {/* Main nav bar */}
        <nav
          className="theme-animate-surface"
          style={{
            background: "var(--homepage-cream)",
            backdropFilter: "blur(20px)",
            borderBottom: isScrolled
              ? "1px solid color-mix(in srgb, var(--brand-gold) 35%, var(--border-color))"
              : "1px solid var(--homepage-cream-border)",
            boxShadow: isScrolled ? "0 4px 24px var(--homepage-card-shadow)" : "none",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              maxWidth: "1380px",
              margin: "0 auto",
              padding: "0 clamp(16px, 3vw, 32px)",
              height: "70px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
            }}
          >
            {/* Logo */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Go to top"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <img
                src={logoSrc}
                alt="North-cot"
                width={180}
                height={58}
                decoding="async"
                style={{
                  height: "58px",
                  width: "auto",
                  maxHeight: "min(58px, 12vw)",
                  objectFit: "contain",
                  objectPosition: "left center",
                  transition: "transform 0.2s ease",
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  if (e.currentTarget.src.endsWith("logo.png")) return;
                  e.currentTarget.src = FALLBACK_LOGO_PNG;
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              />
            </button>

            {/* Desktop Nav */}
            <div
              className="desktop-nav"
              style={{
                alignItems: "center",
                gap: "32px",
                flex: 1,
                justifyContent: "center",
              }}
            >
              {NAV_LINKS.map(({ key, section }) => (
                <button
                  key={key}
                  onClick={() => scrollToSection(section)}
                  className="nav-link-header"
                >
                  {t(lang, key)}
                </button>
              ))}
            </div>

            {/* Desktop Right Controls */}
            <div
              className="desktop-nav"
              style={{ alignItems: "center", gap: "12px", flexShrink: 0 }}
            >
              <ThemeToggle variant="compact" />
              {/* Language toggle — accessible names match visible EN / ಕನ್ನಡ */}
              <div
                role="group"
                aria-label={t(lang, "header.langToggle.ariaLabel")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background:
                    "color-mix(in srgb, var(--homepage-cream-border) 65%, var(--bg-secondary))",
                  borderRadius: "10px",
                  padding: "3px",
                  gap: "2px",
                }}
              >
                {["en", "kn"].map((l) => {
                  const label = t(
                    l,
                    l === "en"
                      ? "header.langToggle.activeEn"
                      : "header.langToggle.activeKn",
                  );
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => dispatch(setLanguage(l))}
                      aria-label={label}
                      aria-pressed={lang === l}
                      className={
                        lang === l ? "lang-btn-active" : "lang-btn-inactive"
                      }
                      style={{
                        padding: "5px 12px",
                        minHeight: "44px",
                        minWidth: "44px",
                        borderRadius: "7px",
                        fontSize: "12px",
                        transition: "all 0.2s ease",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <InstallButton
                size="middle"
                showLabel={false}
                style={{
                  borderColor: "color-mix(in srgb, var(--brand-green) 35%, var(--border-color))",
                  color: "var(--brand-green)",
                }}
              />

              <button
                onClick={handleLoginClick}
                className="header-cta-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 22px",
                  minHeight: "44px",
                  borderRadius: "11px",
                  background: "var(--homepage-cta-bg)",
                  color: "var(--homepage-cta-fg)",
                  fontWeight: 600,
                  fontSize: "13px",
                  letterSpacing: "0.03em",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px var(--homepage-card-shadow)",
                }}
              >
                {isLoggedIn
                  ? t(lang, "header.auth.dashboard")
                  : t(lang, "header.auth.login")}
                <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Mobile: theme → language → hamburger (matches dashboard header) */}
            <div
              className="mobile-bar-controls"
              style={{ display: "none", alignItems: "center", gap: "8px", flexShrink: 0 }}
            >
              <ThemeToggle variant="compact" />
              <div
                role="group"
                aria-label={t(lang, "header.langToggle.ariaLabel")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background:
                    "color-mix(in srgb, var(--homepage-cream-border) 65%, var(--bg-secondary))",
                  borderRadius: "10px",
                  padding: "2px",
                  gap: "2px",
                }}
              >
                {["en", "kn"].map((l) => {
                  const label = t(
                    l,
                    l === "en"
                      ? "header.langToggle.activeEn"
                      : "header.langToggle.activeKn",
                  );
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => dispatch(setLanguage(l))}
                      aria-label={label}
                      aria-pressed={lang === l}
                      className={
                        lang === l ? "lang-btn-active" : "lang-btn-inactive"
                      }
                      style={{
                        padding: "4px 9px",
                        minHeight: "44px",
                        minWidth: "44px",
                        borderRadius: "7px",
                        fontSize: "11px",
                        transition: "all 0.2s ease",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "color-mix(in srgb, var(--bg-elevated) 88%, transparent)",
                  border: "1px solid var(--homepage-cream-border)",
                  cursor: "pointer",
                  color: "var(--brand-green)",
                  boxShadow: "0 1px 6px var(--homepage-card-shadow)",
                }}
              >
                {isMobileMenuOpen ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        <div
          style={{
            overflow: "hidden",
            maxHeight: isMobileMenuOpen ? "500px" : "0",
            opacity: isMobileMenuOpen ? 1 : 0,
            transition: "max-height 0.35s ease, opacity 0.25s ease",
          }}
        >
          <div
            style={{
              margin: "8px 12px 0",
              borderRadius: "16px",
              background: "var(--homepage-cream)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--homepage-cream-border)",
              boxShadow: "0 8px 32px var(--homepage-card-shadow)",
              padding: "12px",
            }}
          >
            {/* Nav + actions (theme & language are on the top bar on mobile) */}
            {NAV_LINKS.map(({ key, section }) => (
              <button
                key={key}
                onClick={() => scrollToSection(section)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  minHeight: "44px",
                  textAlign: "left",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--brand-green)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "color-mix(in srgb, var(--bg-elevated) 75%, transparent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                {t(lang, key)}
              </button>
            ))}

            {/* Mobile auth */}
            <div
              style={{
                borderTop: "1px solid var(--homepage-cream-border)",
                marginTop: "8px",
                paddingTop: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <InstallButton
                  size="middle"
                  showLabel
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--brand-green) 35%, var(--border-color))",
                    color: "var(--brand-green)",
                    width: "100%",
                  }}
                />
              </div>
              <button
                onClick={handleLoginClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  background: "var(--homepage-cta-bg)",
                  color: "var(--homepage-cta-fg)",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px var(--homepage-card-shadow)",
                  letterSpacing: "0.03em",
                }}
              >
                {isLoggedIn
                  ? t(lang, "header.auth.dashboard")
                  : t(lang, "header.auth.login")}
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
