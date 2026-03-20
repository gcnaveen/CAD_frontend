import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { TOKEN_KEY, USER_KEY } from "../config/axiosInstance.js";
import { toggleLanguage } from "../features/i18n/languageSlice";
import { t } from "../constants/translation";
import { ArrowUpRight, User } from "lucide-react";

const getDisplayName = (user) => {
  if (!user) return "User";
  if (typeof user.name === "string") return user.name;
  if (user.name && typeof user.name === "object") {
    const first = user.name.first ?? "";
    const last = user.name.last ?? "";
    return (
      [first, last].filter(Boolean).join(" ") ||
      user.auth?.email ||
      user.email ||
      "User"
    );
  }
  return user.auth?.email || user.email || "User";
};

const NAV_LINKS = [
  { key: "header.nav.howItWorks", section: "how-it-works" },
  { key: "header.nav.benefits", section: "benefits" },
  { key: "header.nav.testimonials", section: "testimonials" },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.language?.lang || "en");

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getRedirectForRole = (role) => {
    const r = (role || "").toUpperCase();
    if (r === "SUPER_ADMIN" || r === "ADMIN") return "/superadmin";
    if (r === "CAD" || r === "CAD_USER") return "/dashboard/cad";
    if (r === "SURVEYOR" || r === "USER" || r === "CUSTOMER")
      return "/dashboard/user";
    return "/login";
  };

  const handleLoginClick = () => {
    const dest = user?.role ? getRedirectForRole(user.role) : "/login";
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
          color: #7a7060;
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
          background: #c9a84c;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease;
        }
        .nav-link-header:hover {
          color: #152815;
        }
        .nav-link-header:hover::after {
          transform: scaleX(1);
        }
        .lang-btn-active {
          background: white;
          color: #152815;
          font-weight: 600;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        .lang-btn-inactive {
          background: transparent;
          color: #7a7060;
          font-weight: 500;
        }
        .header-cta-btn {
          transition: all 0.2s ease;
        }
        .header-cta-btn:hover {
          background: #1f4020 !important;
          box-shadow: 0 10px 28px rgba(21,40,21,0.38) !important;
        }
        @media (max-width: 1023px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
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
          style={{
            background: isScrolled
              ? "rgba(244,239,230,0.95)"
              : "rgba(244,239,230,0.88)",
            backdropFilter: "blur(20px)",
            borderBottom: isScrolled
              ? "1px solid rgba(201,168,76,0.2)"
              : "1px solid rgba(232,226,216,0.6)",
            boxShadow: isScrolled ? "0 4px 24px rgba(0,0,0,0.08)" : "none",
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
                src="/assets/logoblack.png"
                alt="Logo"
                style={{
                  height: "52px",
                  width: "auto",
                  transition: "transform 0.2s ease",
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
              {/* Language toggle */}
              <button
                onClick={() => dispatch(toggleLanguage())}
                aria-label={t(lang, "header.langToggle.ariaLabel")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(232,226,216,0.7)",
                  borderRadius: "10px",
                  padding: "3px",
                  gap: "2px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {["en", "kn"].map((l) => (
                  <span
                    key={l}
                    className={
                      lang === l ? "lang-btn-active" : "lang-btn-inactive"
                    }
                    style={{
                      padding: "5px 12px",
                      borderRadius: "7px",
                      fontSize: "12px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {t(
                      l,
                      l === "en"
                        ? "header.langToggle.activeEn"
                        : "header.langToggle.activeKn",
                    )}
                  </span>
                ))}
              </button>

              <button
                onClick={handleLoginClick}
                className="header-cta-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 22px",
                  borderRadius: "11px",
                  background: "#152815",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "13px",
                  letterSpacing: "0.03em",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(21,40,21,0.28)",
                }}
              >
                {t(lang, "header.auth.login")}
                <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Mobile toggle button */}
            <button
              className="mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              style={{
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(232,226,216,0.9)",
                cursor: "pointer",
                color: "#152815",
                boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
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
              background: "rgba(244,239,230,0.97)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(232,226,216,0.9)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              padding: "12px",
            }}
          >
            {/* Mobile lang toggle */}
            <div
              style={{
                padding: "4px 0 8px",
                borderBottom: "1px solid rgba(232,226,216,0.7)",
                marginBottom: "8px",
              }}
            >
              <button
                onClick={() => dispatch(toggleLanguage())}
                aria-label={t(lang, "header.langToggle.ariaLabel")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  background: "rgba(232,226,216,0.6)",
                  borderRadius: "10px",
                  padding: "3px",
                  gap: "2px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {["en", "kn"].map((l) => (
                  <span
                    key={l}
                    className={
                      lang === l ? "lang-btn-active" : "lang-btn-inactive"
                    }
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "7px 12px",
                      borderRadius: "7px",
                      fontSize: "12px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {t(
                      l,
                      l === "en"
                        ? "header.langToggle.activeEn"
                        : "header.langToggle.activeKn",
                    )}
                  </span>
                ))}
              </button>
            </div>

            {/* Mobile nav links */}
            {NAV_LINKS.map(({ key, section }) => (
              <button
                key={key}
                onClick={() => scrollToSection(section)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#152815",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.7)";
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
                borderTop: "1px solid rgba(232,226,216,0.7)",
                marginTop: "8px",
                paddingTop: "12px",
              }}
            >
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
                  background: "#152815",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(21,40,21,0.28)",
                  letterSpacing: "0.03em",
                }}
              >
                {t(lang, "header.auth.login")}
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
