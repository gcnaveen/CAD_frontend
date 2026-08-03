import React, { useState } from "react";
import { Layout, Menu, Button, Typography } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  ProjectOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  PartitionOutlined,
  ClusterOutlined,
  ApartmentOutlined,
  DesktopOutlined,
  SearchOutlined,
  FormOutlined,
  MoneyCollectOutlined,
  PayCircleOutlined,
  AuditOutlined,
  CloudServerOutlined,
  FileSearchOutlined,
  SolutionOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  normalizeRoleKey,
  resolveStoredUserRole,
} from "../../../constants/roles";
import { performFullLogout } from "../../../utils/performFullLogout.js";
import NotificationBell from "../../../components/Notifications/NotificationBell.jsx";
import InstallButton from "../../../components/pwa/InstallButton.jsx";
import ThemeToggle from "../../../components/ThemeToggle.jsx";
import BuildProvenanceFooter from "../../../components/BuildProvenanceFooter.jsx";
import "./superadminlayout.css";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const allMenuItems = [
  { key: "/superadmin/home", icon: <HomeOutlined />, label: "Home" },
  {
    key: "/superadmin/admin-users",
    icon: <UserOutlined />,
    label: "View Admin Users",
    roles: ["SUPER_ADMIN"],
  },
  {
    key: "/superadmin/projects",
    icon: <ProjectOutlined />,
    label: "View Projects",
  },
  {
    key: "/superadmin/sketch-pricing",
    icon: <MoneyCollectOutlined />,
    label: "Sketch pricing",
    roles: ["SUPER_ADMIN"],
  },
  {
    key: "/superadmin/payments/reconciliation",
    icon: <AuditOutlined />,
    label: "Payment reconciliation",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "/superadmin/ops",
    icon: <CloudServerOutlined />,
    label: "Ops",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "/superadmin/pay-cad-user",
    icon: <PayCircleOutlined />,
    label: "Pay CAD User",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "/superadmin/cad-users",
    icon: <DesktopOutlined />,
    label: "View CAD Users",
  },
  {
    key: "/superadmin/cad-interest",
    icon: <FormOutlined />,
    label: "CAD Interest",
  },
  {
    key: "/superadmin/survey-draft-reports",
    icon: <FileSearchOutlined />,
    label: "Survey draft reports",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "master-data",
    icon: <ClusterOutlined />,
    label: "Master Data",
    children: [
      { key: "/superadmin/districts", icon: <EnvironmentOutlined />, label: "Districts" },
      { key: "/superadmin/talukas", icon: <PartitionOutlined />, label: "Talukas" },
      { key: "/superadmin/hoblis", icon: <ClusterOutlined />, label: "Hoblis" },
      { key: "/superadmin/villages", icon: <ApartmentOutlined />, label: "Villages" },
    ],
  },
  {
    key: "/superadmin/assignments",
    icon: <SolutionOutlined />,
    label: "Sketch Assignments",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "/superadmin/auto-assign/exceptions",
    icon: <WarningOutlined />,
    label: "Auto-assign exceptions",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "/superadmin/user-surveyor-details",
    icon: <SearchOutlined />,
    label: "View User/Surveyor Details",
  },
];

const MASTER_DATA_KEY = "master-data";
const masterPaths = ["/superadmin/districts", "/superadmin/talukas", "/superadmin/hoblis", "/superadmin/villages"];

const SuperAdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isMasterPath = masterPaths.includes(location.pathname);

  const currentRole = normalizeRoleKey(
    useSelector((state) =>
      resolveStoredUserRole(state.auth?.role, state.auth?.user?.role)
    )
  );

  const roleMaySee = (itemRoles) =>
    !itemRoles || (currentRole && itemRoles.includes(currentRole));

  const menuItems = allMenuItems
    .map((item) => {
      if (!roleMaySee(item.roles)) return null;
      if (item.children) {
        const children = item.children.filter((child) =>
          roleMaySee(child.roles)
        );
        if (children.length === 0) return null;
        return { ...item, children };
      }
      return item;
    })
    .filter(Boolean);

  React.useEffect(() => {
    if (isMasterPath) {
      setOpenKeys((prev) =>
        prev.includes(MASTER_DATA_KEY) ? prev : [...prev, MASTER_DATA_KEY]
      );
    }
  }, [isMasterPath]);

  const handleMenuClick = (e) => {
    if (e.key === MASTER_DATA_KEY) return;
    navigate(e.key);
    if (isMobile) setCollapsed(true);
  };

  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  const mapItem = (item) => ({
    ...item,
    label: <span className="superadmin-menu-label">{item.label}</span>,
    ...(item.children && {
      children: item.children.map((child) => ({
        ...child,
        label: <span className="superadmin-menu-label">{child.label}</span>,
      })),
    }),
  });

  const handleLogout = async () => {
    await performFullLogout(dispatch);
    navigate("/login", { replace: true });
  };

  const collapsedWidth = isMobile ? 0 : 80;
  const siderWidth = collapsed ? collapsedWidth : 260;
  const mainMarginLeft = isMobile ? 0 : siderWidth;
  const isAdmin = currentRole === "ADMIN";
  const displayTitle = isAdmin ? "Admin" : "Super Admin";

  return (
    <Layout className="superadmin-layout theme-animate-surface" style={{ minHeight: "100vh" }}>
      {isMobile && !collapsed ? (
        <button
          type="button"
          className="superadmin-sider-backdrop"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setCollapsed(true)}
        />
      ) : null}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setIsMobile(broken);
          if (broken) setCollapsed(true);
        }}
        width={260}
        collapsedWidth={collapsedWidth}
        className="superadmin-sider"
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
          className="superadmin-sider-logo"
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
              src="/assets/logo.webp"
              alt="North Cot CAD"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextElementSibling?.classList?.add("visible");
              }}
            />
            <div
              className="superadmin-logo-fallback"
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
              {displayTitle}
            </Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems.map(mapItem)}
          onClick={handleMenuClick}
          style={{
            background: "transparent",
            borderRight: "none",
            marginTop: 8,
            padding: "0 8px",
          }}
          className="superadmin-menu"
        />
      </Sider>

      <Layout
        className="superadmin-main"
        style={{
          marginLeft: mainMarginLeft,
          transition: "margin-left 0.2s ease",
          minHeight: "100vh",
        }}
      >
        <Header
          className="superadmin-header theme-animate-surface"
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
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
              className="superadmin-trigger"
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
            <NotificationBell layout="superadmin" />
            <Button
              type="default"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="superadmin-logout"
              style={{
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
              }}
            >
              Logout
            </Button>
          </div>
        </Header>

        <Content
          className="superadmin-content theme-animate-surface"
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
          <BuildProvenanceFooter />
        </Content>
      </Layout>
    </Layout>
  );
};

export default SuperAdminLayout;
