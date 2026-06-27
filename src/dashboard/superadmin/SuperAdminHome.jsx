import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, Spin, Tabs, Typography } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  DollarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import UserStats from "./home/UserStats";
import DraftStats from "./home/DraftStats";
import OrderStats from "./home/OrderStats";
import PaymentStats from "./home/PaymentStats";
import { fetchAdminDashboardStats } from "../../services/admin/adminDashboardService.js";
import { ROLES, normalizeRoleKey, resolveStoredUserRole } from "../../constants/roles.js";

const { Title } = Typography;

const SuperAdminHome = () => {
  const roleFromStore = useSelector((s) => s.auth?.role);
  const userRoleFromStore = useSelector((s) => s.auth?.user?.role);
  const roleKey = normalizeRoleKey(
    resolveStoredUserRole(roleFromStore, userRoleFromStore)
  );
  const showPayments = roleKey === ROLES.SUPER_ADMIN;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminDashboardStats();
      setStats(data);
    } catch (e) {
      setStats(null);
      setError(e?.message || "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const tabItems = useMemo(() => {
    const items = [
      {
        key: "users",
        label: (
          <span>
            <UserOutlined /> Users
          </span>
        ),
        children: <UserStats users={stats?.users} loading={loading} />,
      },
      {
        key: "drafts",
        label: (
          <span>
            <FileTextOutlined /> Drafts
          </span>
        ),
        children: <DraftStats drafts={stats?.drafts} loading={loading} />,
      },
      {
        key: "orders",
        label: (
          <span>
            <ShoppingOutlined /> Orders
          </span>
        ),
        children: <OrderStats orders={stats?.orders} loading={loading} />,
      },
    ];

    if (showPayments) {
      items.push({
        key: "payments",
        label: (
          <span>
            <DollarOutlined /> Payments
          </span>
        ),
        children: <PaymentStats payments={stats?.payments} loading={loading} />,
      });
    }

    return items;
  }, [stats, loading, showPayments]);

  return (
    <div style={{ paddingBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Dashboard overview
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadStats}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {error ? (
        <Alert
          type="error"
          message="Could not load dashboard"
          description={error}
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={loadStats}>
              Retry
            </Button>
          }
        />
      ) : null}

      <Spin spinning={loading && !stats}>
        <Tabs defaultActiveKey="users" items={tabItems} size="large" />
      </Spin>
    </div>
  );
};

export default SuperAdminHome;
