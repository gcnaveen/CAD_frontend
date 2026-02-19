import React, { useState } from "react";
import { Layout, Menu, Button, Typography, ConfigProvider } from "antd";
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
import "./cadlayout.css";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const SIDER_BG = "#0f172a";
const SIDER_MENU_ITEM_HOVER = "#1e293b";
const SIDER_ACTIVE_BG = "rgba(56, 189, 248, 0.12)";
const SIDER_ACTIVE_BORDER = "#38bdf8";
const SIDER_TEXT_ACTIVE = "#f8fafc";
const SIDER_TEXT = "rgba(248, 250, 252, 0.9)";
const HEADER_BG = "#ffffff";
const HEADER_BORDER = "#e2e8f0";
const CONTENT_BG = "#f8fafc";
const ACCENT = "#0ea5e9";
const ACCENT_HOVER = "#0284c7";

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

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  const handleLogout = () => {
    navigate("/login");
  };

  const siderWidth = collapsed ? 80 : 260;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: ACCENT,
          colorPrimaryHover: ACCENT_HOVER,
          borderRadius: 8,
        },
        components: {
          Menu: {
            darkItemBg: SIDER_BG,
            darkItemSelectedBg: SIDER_ACTIVE_BG,
            darkItemSelectedColor: SIDER_TEXT_ACTIVE,
            darkItemHoverBg: SIDER_MENU_ITEM_HOVER,
            darkItemColor: SIDER_TEXT,
            itemSelectedBg: SIDER_ACTIVE_BG,
            itemActiveBg: SIDER_ACTIVE_BG,
          },
          Button: {
            defaultBorderColor: HEADER_BORDER,
            defaultColor: "#475569",
          },
        },
      }}
    >
      <Layout className="cad-layout" style={{ minHeight: "100vh" }}>
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
            background: SIDER_BG,
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
              borderBottom: `1px solid ${SIDER_MENU_ITEM_HOVER}`,
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
                  background: SIDER_ACTIVE_BORDER,
                  borderRadius: 8,
                  display: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: collapsed ? 14 : 18,
                  fontWeight: 700,
                  color: SIDER_BG,
                }}
              >
                NC
              </div>
            </div>
            {!collapsed && (
              <Text
                style={{
                  color: SIDER_TEXT_ACTIVE,
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
            style={{
              padding: "0 20px 0 16px",
              background: HEADER_BG,
              borderBottom: `1px solid ${HEADER_BORDER}`,
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
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                North Cot CAD Project
              </Text>
            </div>

            <Button
              type="default"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="cad-logout"
              style={{ borderColor: HEADER_BORDER, color: "#475569" }}
            >
              Logout
            </Button>
          </Header>

          <Content
            className="cad-content"
            style={{
              margin: "24px 16px",
              padding: 24,
              minHeight: "calc(100vh - 64px - 48px)",
              background: CONTENT_BG,
              borderRadius: 12,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default CADLayout;
