import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, Dropdown } from "antd";
import {
  User,
  Phone,
  LogOut,
  History,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { logout } from "../../../features/auth/authSlice";
import { useTheme } from "../../../theme/useTheme.js";
import ThemeToggle from "../../../components/ThemeToggle.jsx";

const FALLBACK_LOGO = "/assets/logo.png";

const UserDashboardHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { resolvedTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoSrc =
    resolvedTheme === "dark" ? FALLBACK_LOGO : "/assets/logoblack.png";

  const _userName =
    localStorage.getItem("userName") ||
    localStorage.getItem("user") ||
    "User";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleChangeNumber = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/dashboard/change-number");
  };

  const handleOrderHistory = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/dashboard/user/order-history");
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const menuItems = [
    {
      key: "change-number",
      icon: <Phone className="h-4 w-4" />,
      label: "Change number",
      onClick: handleChangeNumber,
    },
    {
      key: "order-history",
      icon: <History className="h-4 w-4" />,
      label: "Order history",
      onClick: handleOrderHistory,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogOut className="h-4 w-4" />,
      label: "Logout",
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <>
      <header className="theme-animate-surface sticky top-0 z-40 w-full border-b border-line bg-[color-mix(in_srgb,var(--bg-primary)_92%,transparent)] backdrop-blur supports-backdrop-filter:bg-[color-mix(in_srgb,var(--bg-primary)_80%,transparent)]">
        <div className="flex h-14 md:h-16 items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          {/* Logo - Left */}
          <div className="flex min-w-0 shrink items-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 rounded-md"
            >
              <img
                src={logoSrc}
                alt="North-cot"
                className="h-10 w-auto max-w-[min(200px,52vw)] object-contain object-left sm:h-11 md:h-12"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  if (e.currentTarget.src.endsWith("logo.png")) return;
                  e.currentTarget.src = FALLBACK_LOGO;
                }}
              />
            </button>
          </div>

          {/* Mobile: theme → language → hamburger */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <ThemeToggle variant="compact" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-secondary)_90%,transparent)] text-fg"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          {/* Desktop / large: avatar dropdown */}
          <div className="hidden items-center gap-2 lg:flex">
            <Dropdown
              menu={{ items: menuItems }}
              trigger={["click"]}
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              placement="bottomRight"
              overlayClassName="dashboard-header-dropdown"
              overlayStyle={{
                maxWidth: "min(320px, calc(100vw - 2rem))",
              }}
            >
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full p-1.5 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 sm:p-0.5 touch-manipulation"
                aria-label="Profile menu"
              >
                <Avatar
                  size={36}
                  className="shrink-0 border-2 border-line bg-[var(--cyan-accent)] text-white shadow-sm"
                  icon={<User className="h-5 w-5" />}
                />
                <ChevronDown
                  className={`hidden h-4 w-4 shrink-0 text-fg-muted transition-transform sm:block ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Mobile slide-out (profile actions) */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/45 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed right-0 top-14 z-[61] flex h-[calc(100dvh-3.5rem)] w-[min(100vw-2.5rem,320px)] flex-col border-l border-line bg-[color-mix(in_srgb,var(--bg-elevated)_98%,transparent)] shadow-xl backdrop-blur-md lg:hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-bold text-fg">Account</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fg"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1 p-3">
              {menuItems
                .filter((item) => item.type !== "divider")
                .map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => item.onClick?.()}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${
                      item.danger
                        ? "text-danger hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
                        : "text-fg hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default UserDashboardHeader;
