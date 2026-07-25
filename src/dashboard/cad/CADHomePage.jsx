import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Progress,
  Space,
  Divider,
  Button,
  Skeleton,
  message,
} from "antd";
import {
  ProjectOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  EditOutlined,
  WalletOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { getCadDashboardOverview } from "../../services/cad/cadWalletService.js";
import { cadBi, cadBiFmt } from "./cadBilingual";

const { Title, Text } = Typography;

const BarChart = ({ data, colors, height = 12 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height,
        borderRadius: 4,
        overflow: "hidden",
        backgroundColor: "var(--bg-hover)",
      }}
    >
      {data.map((item, i) => (
        <div
          key={i}
          style={{
            width: `${(item.value / total) * 100}%`,
            backgroundColor: colors[i] || "var(--text-secondary)",
            transition: "width 0.3s ease",
          }}
          title={`${item.label}: ${item.value}`}
        />
      ))}
    </div>
  );
};

const EMPTY_OVERVIEW = {
  wallet: {
    totalEarningsRupees: 0,
    receivedPaymentRupees: 0,
    pendingPaymentRupees: 0,
  },
  orders: {
    totalOrders: 0,
    acceptedOrders: 0,
    rejectedOrders: 0,
    inProgressOrders: 0,
  },
};

const CADHomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCadDashboardOverview();
      setOverview(data);
    } catch (e) {
      const msg = e?.message || cadBi.home.loadFail;
      setError(msg);
      message.error(msg);
      setOverview(EMPTY_OVERVIEW);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const { wallet, orders } = overview;
  const chartData = [
    { label: cadBi.home.chartAccepted, value: orders.acceptedOrders },
    { label: cadBi.home.chartInProgress, value: orders.inProgressOrders },
    { label: cadBi.home.chartRejected, value: orders.rejectedOrders },
  ];
  const chartColors = ["var(--success)", "var(--accent-color)", "var(--danger)"];
  const acceptancePct =
    orders.totalOrders > 0
      ? Math.round((orders.acceptedOrders / orders.totalOrders) * 100)
      : 0;

  return (
    <div style={{ paddingBottom: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        {cadBi.home.pageTitle}
      </Title>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate("/profile")}>
            {cadBi.home.editProfile}
          </Button>
          <Button icon={<WalletOutlined />} onClick={() => navigate("/dashboard/cad/wallet")}>
            {cadBi.home.viewWallet}
          </Button>
        </Space>
      </div>

      {error ? (
        <Text type="danger" style={{ display: "block", marginBottom: 16 }}>
          {error}
        </Text>
      ) : null}

      <Title level={5} style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
        {cadBi.home.walletSummary}
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title={cadBi.wallet.totalEarnings}
                value={wallet.totalEarningsRupees}
                prefix={<DollarOutlined style={{ color: "var(--accent-color)" }} />}
                suffix="₹"
                precision={2}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title={cadBi.wallet.receivedPayment}
                value={wallet.receivedPaymentRupees}
                prefix={<CheckCircleOutlined style={{ color: "var(--success)" }} />}
                suffix="₹"
                precision={2}
                valueStyle={{ color: "var(--success)" }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title={cadBi.wallet.pendingPayment}
                value={wallet.pendingPaymentRupees}
                prefix={<ClockCircleOutlined style={{ color: "var(--warning)" }} />}
                suffix="₹"
                precision={2}
                valueStyle={{ color: "var(--warning)" }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: "24px 0" }} />

      <Title level={5} style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
        {cadBi.home.orderStats}
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title={cadBi.home.totalOrders}
                value={orders.totalOrders}
                prefix={<ProjectOutlined style={{ color: "var(--accent-color)" }} />}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  title={cadBi.home.acceptedOrders}
                  value={orders.acceptedOrders}
                  prefix={<CheckCircleOutlined style={{ color: "var(--success)" }} />}
                />
                <Progress
                  percent={acceptancePct}
                  showInfo={false}
                  strokeColor="var(--success)"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  title={cadBi.home.rejectedOrders}
                  value={orders.rejectedOrders}
                  prefix={<CloseCircleOutlined style={{ color: "var(--danger)" }} />}
                />
                {orders.totalOrders > 0 ? (
                  <Progress
                    percent={Math.round((orders.rejectedOrders / orders.totalOrders) * 100)}
                    showInfo={false}
                    strokeColor="var(--danger)"
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                ) : null}
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title={cadBi.home.inProgress}
                value={orders.inProgressOrders}
                prefix={<SyncOutlined style={{ color: "var(--accent-color)" }} />}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: "24px 0" }} />

      <Title level={5} style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
        {cadBi.home.ordersByStatus}
      </Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card size="small" title={cadBi.home.statusBreakdown}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : orders.totalOrders === 0 ? (
              <Text type="secondary">{cadBi.orders.totalOrders.replace("{n}", "0")}</Text>
            ) : (
              <>
                <BarChart data={chartData} colors={chartColors} height={24} />
                <Space split={<Divider type="vertical" />} style={{ marginTop: 12 }} wrap>
                  <Text>
                    <span style={{ color: chartColors[0], fontWeight: 600 }}>
                      {orders.acceptedOrders}
                    </span>{" "}
                    {cadBi.home.chartAccepted}
                  </Text>
                  <Text>
                    <span style={{ color: chartColors[1], fontWeight: 600 }}>
                      {orders.inProgressOrders}
                    </span>{" "}
                    {cadBi.home.chartInProgress}
                  </Text>
                  <Text>
                    <span style={{ color: chartColors[2], fontWeight: 600 }}>
                      {orders.rejectedOrders}
                    </span>{" "}
                    {cadBi.home.chartRejected}
                  </Text>
                </Space>
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title={cadBi.home.acceptanceRate}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <>
                <Progress
                  type="circle"
                  percent={acceptancePct}
                  strokeColor="var(--success)"
                  format={(p) => `${p}%`}
                />
                <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                  {cadBiFmt(cadBi.home.acceptedOfTotal, {
                    a: orders.acceptedOrders,
                    t: orders.totalOrders,
                  })}
                </Text>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CADHomePage;
