import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Avatar, Dropdown } from "antd";
import { logout } from "../../../features/auth/authSlice";
import {
  User,
  Phone,
  LogOut,
  History,
  ChevronDown,
} from "lucide-react";

const UserDashboardHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // User display name from localStorage (for future use in dropdown label)
  const _userName =
    localStorage.getItem("userName") ||
    localStorage.getItem("user") ||
    "User";

  const handleChangeNumber = () => {
    setDropdownOpen(false);
    // TODO: Navigate to change number page or open modal
    navigate("/dashboard/change-number");
  };

  const handleOrderHistory = () => {
    setDropdownOpen(false);
    navigate("dashboard/user/order-history");
  };

  const handleLogout = () => {
    setDropdownOpen(false);
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
    <header className="theme-animate-surface sticky top-0 z-40 w-full border-b border-line bg-[color-mix(in_srgb,var(--bg-primary)_92%,transparent)] backdrop-blur supports-backdrop-filter:bg-[color-mix(in_srgb,var(--bg-primary)_80%,transparent)]">
      <div className="flex h-14 md:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - Left */}
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 rounded-md"
          >
            <img
              src="/assets/logo.png"
              alt="Logo"
              className="h-8 sm:h-9 md:h-10 w-auto"
            />
          </button>
        </div>

        {/* Avatar + Dropdown - Right */}
        <div className="flex items-center gap-2">
          {/* <span className="hidden md:inline text-sm text-gray-600 font-medium">
            {userName}
          </span> */}
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
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 p-1.5 sm:p-0.5 hover:opacity-90 transition-opacity touch-manipulation"
              aria-label="Profile menu"
            >
              <Avatar
                size={36}
                className="bg-[var(--cyan-accent)] text-white border-2 border-line shadow-sm shrink-0"
                icon={<User className="h-5 w-5" />}
              />
              <ChevronDown
                className={`hidden sm:block h-4 w-4 text-fg-muted transition-transform shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default UserDashboardHeader;
