// Layout wrapper — uses <Outlet /> for nested routes
import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../features/auth/authSlice";
import NotificationBell from "../../../components/Notifications/NotificationBell.jsx";
import InstallButton from "../../../components/pwa/InstallButton.jsx";
import ThemeToggle from "../../../components/ThemeToggle.jsx";

/* ─── Icons ─── */
const HomeIcon = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2.2 : 1.8}
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);
const RequestsIcon = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2.2 : 1.8}
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);
const ProfileIcon = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2.2 : 1.8}
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const LogOutIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const ChevronRight = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-4 h-4 ml-auto opacity-40"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const NAV_ITEMS = [
  { label: "Home", path: "/dashboard/user", exact: true, icon: HomeIcon },
  {
    label: "Requests",
    path: "/dashboard/user/requests",
    exact: false,
    icon: RequestsIcon,
  },
  {
    label: "Profile",
    path: "/dashboard/user/profile",
    exact: false,
    icon: ProfileIcon,
  },
];

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const userName =
    useSelector((s) => s.auth?.userName) ||
    localStorage.getItem("userName") ||
    "User";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const isActive = ({ path, exact }) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const goTo = (path) => {
    navigate(path);
  };

  return (
    <div className="theme-animate-surface min-h-screen bg-linear-to-br from-surface via-surface-2 to-surface font-ibm text-fg">
      {/* HEADER */}
      <header className="theme-animate-surface fixed top-0 left-0 right-0 z-50 h-14 bg-[color-mix(in_srgb,var(--bg-elevated)_92%,transparent)] backdrop-blur border-b border-line">
        <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="Logo"
              className="h-9 w-auto cursor-pointer"
              onClick={() => navigate("/")}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle variant="compact" />
            <InstallButton
              type="default"
              size="middle"
              className="border-line text-accent hover:text-accent-soft"
            />
            <NotificationBell layout="user" />
            <button
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--user-accent)] text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
              onClick={handleLogout}
            >
              <LogOutIcon /> Logout
            </button>

            <button
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--user-accent)] text-white font-extrabold border-2 border-line shadow-sm cursor-pointer"
              title={userName}
              onClick={() => goTo("/dashboard/user/profile")}
            >
              {userName?.charAt(0)?.toUpperCase?.() || "U"}
            </button>
          </div>
        </div>
      </header>

      <div className="pt-14">
        {/* SIDEBAR (desktop) */}
        <aside className="theme-animate-surface hidden lg:flex fixed top-14 left-0 w-64 h-[calc(100vh-56px)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] backdrop-blur border-r border-line z-30 shadow-[2px_0_12px_color-mix(in_srgb,var(--user-accent)_12%,transparent)]">
          <div className="rounded-xl w-full flex flex-col px-4 py-5">
            <div className="text-[11px] font-extrabold tracking-wider text-fg-muted uppercase px-2 mb-2">
              Navigation
            </div>
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => goTo(item.path)}
                    className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-extrabold transition-colors ${
                      active
                        ? "bg-[color-mix(in_srgb,var(--user-accent)_14%,var(--bg-secondary))] text-[var(--user-accent)]"
                        : "text-fg-muted hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-[var(--user-accent)]" />
                    )}
                    <Icon active={active} />
                    <span>{item.label}</span>
                    <ChevronRight />
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-4 border-t border-line">
              <button
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-extrabold text-danger hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] transition-colors"
                onClick={handleLogout}
              >
                <LogOutIcon /> Logout
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="lg:pl-64 px-4 sm:px-6 pb-24">
          <Outlet />
        </main>
      </div>

      {/* BOTTOM TABS (mobile) */}
      <nav className="theme-animate-surface lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[color-mix(in_srgb,var(--bg-elevated)_92%,transparent)] backdrop-blur border-t border-line">
        <div className="h-full flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => goTo(item.path)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-[var(--user-accent)] font-extrabold" : "text-fg-muted"
                }`}
              >
                <Icon active={active} />
                <span className="text-[11px] font-extrabold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
