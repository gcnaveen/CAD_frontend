import React from "react";
import { Card, Row, Col, Statistic, Typography, Skeleton } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

const UserStats = ({ users, loading }) => {
  if (loading && !users) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  const u = users ?? {};

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Total Users"
              value={u.totalUsers ?? 0}
              prefix={<UserOutlined style={{ color: "var(--accent-color)" }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {u.superAdminUsers
                ? `${u.superAdminUsers} Super Admin · Admin, CAD & Surveyors`
                : "Admin, CAD Centers & Surveyors"}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Admin Users"
              value={u.adminUsers ?? 0}
              prefix={<UserOutlined style={{ color: "var(--violet-accent)" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="CAD Users"
              value={u.cadUsers ?? 0}
              prefix={<UserOutlined style={{ color: "var(--cyan-accent)" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Surveyor / End Users"
              value={u.surveyorUsers ?? 0}
              prefix={<UserOutlined style={{ color: "var(--success)" }} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserStats;
