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
} from "antd";
import {
  WalletOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

/** Static placeholder data until API wiring */
export const STATIC_PAYMENT_STATS = {
  total: 284500,
  pending: 42500,
  failed: 8500,
  currency: "₹",
};

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

const PaymentStats = () => {
  const p = STATIC_PAYMENT_STATS;
  const attempted = p.total + p.pending + p.failed;
  const successRate =
    attempted > 0
      ? Math.round(((p.total + p.pending) / attempted) * 100)
      : 0;

  const paymentChartData = [
    { label: "Settled / captured", value: p.total },
    { label: "Pending", value: p.pending },
    { label: "Failed", value: p.failed },
  ];
  const paymentColors = ["var(--success)", "var(--warning)", "var(--danger)"];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Total received"
              value={p.total}
              prefix={<WalletOutlined style={{ color: "var(--success)" }} />}
              precision={2}
              formatter={(val) => `${p.currency} ${val?.toLocaleString("en-IN")}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Pending"
              value={p.pending}
              prefix={<ClockCircleOutlined style={{ color: "var(--warning)" }} />}
              precision={2}
              formatter={(val) => `${p.currency} ${val?.toLocaleString("en-IN")}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Failed"
              value={p.failed}
              prefix={
                <ExclamationCircleOutlined style={{ color: "var(--danger)" }} />
              }
              precision={2}
              formatter={(val) => `${p.currency} ${val?.toLocaleString("en-IN")}`}
            />
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
                  {p.currency} {p.total.toLocaleString("en-IN")}
                </span>{" "}
                Settled
              </Text>
              <Text>
                <span style={{ color: paymentColors[1], fontWeight: 600 }}>
                  {p.currency} {p.pending.toLocaleString("en-IN")}
                </span>{" "}
                Pending
              </Text>
              <Text>
                <span style={{ color: paymentColors[2], fontWeight: 600 }}>
                  {p.currency} {p.failed.toLocaleString("en-IN")}
                </span>{" "}
                Failed
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card size="small" title="Payment success rate (static)">
            <Progress
              type="circle"
              percent={successRate}
              strokeColor="var(--accent-color)"
              format={(pct) => `${pct}%`}
            />
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              Based on sample totals above
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PaymentStats;
