import React from "react";
import { Card, Row, Col, Statistic, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

/** Static placeholder data until API wiring */
export const STATIC_USER_STATS = {
  total: 156,
  adminUsers: 12,
  cadCenterUsers: 8,
  endUsers: 136,
};

const UserStats = () => {
  const u = STATIC_USER_STATS;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Total Users"
              value={u.total}
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
              value={u.adminUsers}
              prefix={<UserOutlined style={{ color: "var(--violet-accent)" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="CAD Center Users"
              value={u.cadCenterUsers}
              prefix={<UserOutlined style={{ color: "var(--cyan-accent)" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="End Users"
              value={u.endUsers}
              prefix={<UserOutlined style={{ color: "var(--success)" }} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserStats;
