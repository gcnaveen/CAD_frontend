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
  ProjectOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { DUMMY_ORDER_STATS } from "./orders/ordersData";

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

const CADHomePage = () => {
  const stats = DUMMY_ORDER_STATS;
  const chartData = [
    { label: "Approved", value: stats.approved },
    { label: "Pending", value: stats.pending },
    { label: "Need Changes", value: stats.needChanges },
    { label: "Rejected", value: stats.rejected },
  ];
  const chartColors = [
    "var(--success)",
    "var(--accent-color)",
    "var(--warning)",
    "var(--danger)",
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        CAD Center Dashboard
      </Title>

      <Title level={5} style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
        Order Statistics
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Total Orders"
              value={stats.total}
              prefix={<ProjectOutlined style={{ color: "var(--accent-color)" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Approved Orders"
              value={stats.approved}
              prefix={<CheckCircleOutlined style={{ color: "var(--success)" }} />}
            />
            <Progress
              percent={Math.round((stats.approved / stats.total) * 100)}
              showInfo={false}
              strokeColor="var(--success)"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Rejected Orders"
              value={stats.rejected}
              prefix={<CloseCircleOutlined style={{ color: "var(--danger)" }} />}
            />
            <Progress
              percent={Math.round((stats.rejected / stats.total) * 100)}
              showInfo={false}
              strokeColor="var(--danger)"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="In Progress"
              value={stats.pending + stats.needChanges}
              prefix={<SyncOutlined style={{ color: "var(--accent-color)" }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Pending: {stats.pending} · Need changes: {stats.needChanges}
            </Text>
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: "24px 0" }} />

      <Title level={5} style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
        Orders by Status
      </Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Status breakdown">
            <BarChart data={chartData} colors={chartColors} height={24} />
            <Space
              split={<Divider type="vertical" />}
              style={{ marginTop: 12 }}
              wrap
            >
              <Text>
                <span style={{ color: chartColors[0], fontWeight: 600 }}>
                  {stats.approved}
                </span>{" "}
                Approved
              </Text>
              <Text>
                <span style={{ color: chartColors[1], fontWeight: 600 }}>
                  {stats.pending}
                </span>{" "}
                Pending
              </Text>
              <Text>
                <span style={{ color: chartColors[2], fontWeight: 600 }}>
                  {stats.needChanges}
                </span>{" "}
                Need changes
              </Text>
              <Text>
                <span style={{ color: chartColors[3], fontWeight: 600 }}>
                  {stats.rejected}
                </span>{" "}
                Rejected
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Completion rate">
            <Progress
              type="circle"
              percent={Math.round((stats.approved / stats.total) * 100)}
              strokeColor="var(--success)"
              format={(p) => `${p}%`}
            />
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              {stats.approved} of {stats.total} orders approved
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CADHomePage;
