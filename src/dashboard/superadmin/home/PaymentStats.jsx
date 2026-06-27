import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Progress,
  Space,
  Divider,
  Skeleton,
} from "antd";
import {
  WalletOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { formatRupees } from "../../../utils/formatRupees.js";

const { Text } = Typography;

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

const PaymentStats = ({ payments, loading }) => {
  if (loading && !payments) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  const received = payments?.totalReceived ?? {};
  const pending = payments?.pending ?? {};
  const failed = payments?.failed ?? {};

  const receivedAmount = received.amountRupees ?? 0;
  const pendingAmount = pending.amountRupees ?? 0;
  const pendingCount = pending.count ?? 0;
  const failedCount = failed.count ?? 0;

  const attempted = receivedAmount + pendingAmount;
  const successRate =
    attempted > 0 ? Math.round((receivedAmount / attempted) * 100) : 0;

  const paymentChartData = [
    { label: "Received", value: receivedAmount },
    { label: "Pending", value: pendingAmount },
  ].filter((item) => item.value > 0);
  const paymentColors = ["var(--success)", "var(--warning)"];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Total received"
              value={receivedAmount}
              prefix={<WalletOutlined style={{ color: "var(--success)" }} />}
              formatter={() => formatRupees(receivedAmount)}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {received.sketchUploadPayments ?? 0} sketch ·{" "}
              {received.revisionPayments ?? 0} revision
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Pending payments"
              value={pendingCount}
              prefix={<ClockCircleOutlined style={{ color: "var(--warning)" }} />}
              suffix={
                <Text type="secondary" style={{ fontSize: 14 }}>
                  ({formatRupees(pendingAmount)})
                </Text>
              }
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {pending.sketchUploadPending ?? 0} sketch ·{" "}
              {pending.revisionPaymentPending ?? 0} revision
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Failed payments"
              value={failedCount}
              prefix={
                <ExclamationCircleOutlined style={{ color: "var(--danger)" }} />
              }
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {failed.sketchUploadFailed ?? 0} sketch ·{" "}
              {failed.revisionPaymentFailed ?? 0} revision
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card
            size="small"
            title={
              <Space>
                <DollarOutlined />
                <span>Payments overview</span>
              </Space>
            }
          >
            <BarChart data={paymentChartData} colors={paymentColors} height={24} />
            <Space split={<Divider type="vertical" />} style={{ marginTop: 12 }} wrap>
              <Text>
                <span style={{ color: paymentColors[0], fontWeight: 600 }}>
                  {formatRupees(receivedAmount)}
                </span>{" "}
                Received
              </Text>
              <Text>
                <span style={{ color: paymentColors[1], fontWeight: 600 }}>
                  {pendingCount} ({formatRupees(pendingAmount)})
                </span>{" "}
                Pending
              </Text>
              <Text>
                <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                  {failedCount}
                </span>{" "}
                Failed
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card size="small" title="Collection rate">
            <Progress
              type="circle"
              percent={successRate}
              strokeColor="var(--accent-color)"
              format={(pct) => `${pct}%`}
            />
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              Received vs received + pending amount
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PaymentStats;
