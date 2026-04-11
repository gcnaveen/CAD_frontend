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
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../features/auth/authSlice";
import NotificationBell from "../../../components/Notifications/NotificationBell.jsx";
import InstallButton from "../../../components/pwa/InstallButton.jsx";
import ThemeToggle from "../../../components/ThemeToggle.jsx";
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
    key: "/superadmin/sketch-pricing",
    icon: <MoneyCollectOutlined />,
    label: "Sketch pricing",
    roles: ["SUPER_ADMIN"],
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
    key: "/superadmin/projects",
    icon: <ProjectOutlined />,
    label: "View Projects",
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
  const [openKeys, setOpenKeys] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isMasterPath = masterPaths.includes(location.pathname);

  const userRole = useSelector((state) => state.auth?.role);
  const currentRole = userRole || (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored)?.role : null;
    } catch {
      return null;
    }
  })();

  const getFilteredMenuItems = () => {
    return allMenuItems.filter((item) => {
      if (item.roles && !item.roles.includes(currentRole)) {
        return false;
      }
      if (item.children) {
        item.children = item.children.filter((child) => {
          if (child.roles && !child.roles.includes(currentRole)) {
            return false;
          }
          return true;
        });
        if (item.children.length === 0) {
          return false;
        }
      }
      return true;
    });
  };

  const menuItems = getFilteredMenuItems();

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

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const siderWidth = collapsed ? 80 : 260;
  const isAdmin = currentRole === "ADMIN";
  const displayTitle = isAdmin ? "Admin" : "Super Admin";

  return (
    <Layout className="superadmin-layout theme-animate-surface" style={{ minHeight: "100vh" }}>
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
              src="/assets/logo.png"
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
          marginLeft: siderWidth,
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
        </Content>
      </Layout>
    </Layout>
  );
};

export default SuperAdminLayout;
