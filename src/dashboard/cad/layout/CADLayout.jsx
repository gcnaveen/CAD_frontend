import React, { useState } from "react";
import { Layout, Menu, Button, Typography } from "antd";
import {
  HomeOutlined,
  ProjectOutlined,
  HistoryOutlined,
  WalletOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../../features/auth/authSlice";
import NotificationBell from "../../../components/Notifications/NotificationBell.jsx";
import InstallButton from "../../../components/pwa/InstallButton.jsx";
import ThemeToggle from "../../../components/ThemeToggle.jsx";
import "./cadlayout.css";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: "/dashboard/cad", icon: <HomeOutlined />, label: "Home" },
  {
    key: "/dashboard/cad/current-orders",
    icon: <ProjectOutlined />,
    label: "View Current Projects",
  },
  {
    key: "/dashboard/cad/order-history",
    icon: <HistoryOutlined />,
    label: "View Order History",
  },
  {
    key: "/dashboard/cad/wallet",
    icon: <WalletOutlined />,
    label: "View Wallet",
  },
];

const CADLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const siderWidth = collapsed ? 80 : 260;

  return (
    <Layout className="cad-layout theme-animate-surface" style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          if (broken) setCollapsed(true);
        }}
        width={260}
        collapsedWidth={80}
        className="cad-sider"
        style={{
          background: "var(--layout-sider-bg)",
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          className="cad-sider-logo"
          style={{
            padding: collapsed ? "16px 12px" : "20px 16px",
            minHeight: collapsed ? 80 : 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: collapsed ? 0 : 10,
            borderBottom: "1px solid var(--layout-sider-border)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: collapsed ? 40 : 56,
              height: collapsed ? 40 : 56,
              flexShrink: 0,
            }}
          >
            <img
              src="/assets/logo.png"
              alt="North Cot CAD"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextElementSibling?.classList?.add("visible");
              }}
            />
            <div
              className="cad-logo-fallback"
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--layout-sider-accent)",
                borderRadius: 8,
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                fontSize: collapsed ? 14 : 18,
                fontWeight: 700,
                color: "var(--layout-sider-bg)",
              }}
            >
              NC
            </div>
          </div>
          {!collapsed && (
            <Text
              style={{
                color: "var(--layout-sider-text)",
                fontSize: 13,
                fontWeight: 600,
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              CAD Center
            </Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map((item) => ({
            ...item,
            label: <span className="cad-menu-label">{item.label}</span>,
          }))}
          onClick={handleMenuClick}
          style={{
            background: "transparent",
            borderRight: "none",
            marginTop: 8,
            padding: "0 8px",
          }}
          className="cad-menu"
        />
      </Sider>

      <Layout
        style={{
          marginLeft: siderWidth,
          transition: "margin-left 0.2s ease",
          minHeight: "100vh",
        }}
      >
        <Header
          className="theme-animate-surface"
          style={{
            padding: "0 20px 0 16px",
            background: "var(--bg-elevated)",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
            height: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              type="text"
              icon={
                collapsed ? (
                  <MenuUnfoldOutlined style={{ fontSize: 18 }} />
                ) : (
                  <MenuFoldOutlined style={{ fontSize: 18 }} />
                )
              }
              onClick={() => setCollapsed(!collapsed)}
              className="cad-trigger"
              aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            />
            <Text
              strong
              style={{
                fontSize: "clamp(1rem, 2vw, 1.25rem)",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              North Cot CAD Project
            </Text>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ThemeToggle variant="compact" />
            <InstallButton
              size="middle"
              style={{
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
              }}
            />
            <NotificationBell layout="cad" />
            <Button
              type="default"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="cad-logout"
              style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
            >
              Logout
            </Button>
          </div>
        </Header>

        <Content
          className="cad-content theme-animate-surface"
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: "calc(100vh - 64px - 48px)",
            background: "var(--bg-secondary)",
            borderRadius: 12,
            color: "var(--text-primary)",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default CADLayout;
