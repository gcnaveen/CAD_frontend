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
  UserOutlined,
  ProjectOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  WalletOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// Dummy dashboard data
const DASHBOARD_DATA = {
  users: {
    total: 156,
    adminUsers: 12,
    cadCenterUsers: 8,
    endUsers: 136,
  },
  projects: {
    completed: 89,
    rejected: 14,
    inProgress: 23,
    total: 126,
  },
  payments: {
    total: 284500,
    pending: 42500,
    failed: 8500,
    currency: "₹",
  },
};

// Simple bar segment for visual breakdown
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

const SuperAdminHome = () => {
  const { users, projects, payments } = DASHBOARD_DATA;

  const projectChartData = [
    { label: "Completed", value: projects.completed },
    { label: "In Progress", value: projects.inProgress },
    { label: "Rejected", value: projects.rejected },
  ];
  const projectColors = ["var(--success)", "var(--accent-color)", "var(--danger)"];

  const paymentChartData = [
    { label: "Total", value: payments.total },
    { label: "Pending", value: payments.pending },
    { label: "Failed", value: payments.failed },
  ];
  const paymentColors = ["var(--success)", "var(--warning)", "var(--danger)"];

  return (
    <div style={{ paddingBottom: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        Dashboard Overview
      </Title>

      {/* User count stats */}
      <Title level={5} style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
        User Statistics
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Total Users"
              value={users.total}
              prefix={<UserOutlined style={{ color: "var(--accent-color)" }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Admin, CAD Centers & End Users
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Admin Users"
              value={users.adminUsers}
              prefix={<UserOutlined style={{ color: "var(--violet-accent)" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="CAD Center Users"
              value={users.cadCenterUsers}
              prefix={<UserOutlined style={{ color: "var(--cyan-accent)" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="End Users"
              value={users.endUsers}
              prefix={<UserOutlined style={{ color: "var(--success)" }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Projects: completed, rejected, in progress */}
      <Title level={5} style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
        Project Statistics
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Completed"
              value={projects.completed}
              prefix={<CheckCircleOutlined style={{ color: "var(--success)" }} />}
            />
            <Progress
              percent={Math.round((projects.completed / projects.total) * 100)}
              showInfo={false}
              strokeColor="var(--success)"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="In Progress"
              value={projects.inProgress}
              prefix={<SyncOutlined spin style={{ color: "var(--accent-color)" }} />}
            />
            <Progress
              percent={Math.round((projects.inProgress / projects.total) * 100)}
              showInfo={false}
              strokeColor="var(--accent-color)"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Rejected"
              value={projects.rejected}
              prefix={<CloseCircleOutlined style={{ color: "var(--danger)" }} />}
            />
            <Progress
              percent={Math.round((projects.rejected / projects.total) * 100)}
              showInfo={false}
              strokeColor="var(--danger)"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Payment stats */}
      <Title level={5} style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
        Payment Recieved Statistics
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Total Payment"
              value={payments.total}
              prefix={<WalletOutlined style={{ color: "var(--success)" }} />}
              precision={2}
              formatter={(val) =>
                `${payments.currency} ${val?.toLocaleString("en-IN")}`
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Pending Payment"
              value={payments.pending}
              prefix={<ClockCircleOutlined style={{ color: "var(--warning)" }} />}
              precision={2}
              formatter={(val) =>
                `${payments.currency} ${val?.toLocaleString("en-IN")}`
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Failed Payments"
              value={payments.failed}
              prefix={
                <ExclamationCircleOutlined style={{ color: "var(--danger)" }} />
              }
              precision={2}
              formatter={(val) =>
                `${payments.currency} ${val?.toLocaleString("en-IN")}`
              }
            />
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: "24px 0" }} />

      {/* Graphs section */}
      <Title level={5} style={{ marginBottom: 20, color: "var(--text-secondary)" }}>
        Overview Charts
      </Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <Space>
                <ProjectOutlined />
                <span>Projects by Status</span>
              </Space>
            }
          >
            <BarChart
              data={projectChartData}
              colors={projectColors}
              height={24}
            />
            <Space
              split={<Divider type="vertical" />}
              style={{ marginTop: 12 }}
            >
              <Text>
                <span style={{ color: projectColors[0], fontWeight: 600 }}>
                  {projects.completed}
                </span>{" "}
                Completed
              </Text>
              <Text>
                <span style={{ color: projectColors[1], fontWeight: 600 }}>
                  {projects.inProgress}
                </span>{" "}
                In Progress
              </Text>
              <Text>
                <span style={{ color: projectColors[2], fontWeight: 600 }}>
                  {projects.rejected}
                </span>{" "}
                Rejected
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <Space>
                <DollarOutlined />
                <span>Payments Overview</span>
              </Space>
            }
          >
            <BarChart
              data={paymentChartData}
              colors={paymentColors}
              height={24}
            />
            <Space
              split={<Divider type="vertical" />}
              style={{ marginTop: 12 }}
              wrap
            >
              <Text>
                <span style={{ color: paymentColors[0], fontWeight: 600 }}>
                  {payments.currency} {payments.total.toLocaleString("en-IN")}
                </span>{" "}
                Total
              </Text>
              <Text>
                <span style={{ color: paymentColors[1], fontWeight: 600 }}>
                  {payments.currency} {payments.pending.toLocaleString("en-IN")}
                </span>{" "}
                Pending
              </Text>
              <Text>
                <span style={{ color: paymentColors[2], fontWeight: 600 }}>
                  {payments.currency} {payments.failed.toLocaleString("en-IN")}
                </span>{" "}
                Failed
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Summary progress - projects completion rate */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card size="small" title="Project Completion Rate">
            <Progress
              type="circle"
              percent={Math.round((projects.completed / projects.total) * 100)}
              strokeColor="var(--success)"
              format={(p) => `${p}%`}
            />
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              {projects.completed} of {projects.total} projects completed
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title="Payment Success Rate">
            <Progress
              type="circle"
              percent={Math.round(
                ((payments.total + payments.pending) /
                  (payments.total + payments.pending + payments.failed)) *
                  100,
              )}
              strokeColor="var(--accent-color)"
              format={(p) => `${p}%`}
            />
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              Successful vs total attempted payments
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SuperAdminHome;
