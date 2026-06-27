import React from "react";
import { Card, Row, Col, Statistic, Typography, Progress, Skeleton, Tag, Space } from "antd";
import {
  ShoppingOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  UserSwitchOutlined,
  SendOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const ORDER_STATUS_CONFIG = [
  {
    key: "PAYMENT_PENDING",
    title: "Payment Pending",
    icon: CreditCardOutlined,
    color: "var(--warning)",
    tagColor: "gold",
  },
  {
    key: "PENDING",
    title: "Pending Assignment",
    icon: ClockCircleOutlined,
    color: "var(--accent-color)",
    tagColor: "blue",
  },
  {
    key: "ASSIGNED",
    title: "Assigned",
    icon: UserSwitchOutlined,
    color: "var(--cyan-accent)",
    tagColor: "processing",
  },
  {
    key: "CAD_DELIVERED",
    title: "CAD Delivered",
    icon: SendOutlined,
    color: "var(--violet-accent)",
    tagColor: "cyan",
  },
  {
    key: "UNDER_REVISION",
    title: "Under Revision",
    icon: SyncOutlined,
    color: "var(--warning)",
    tagColor: "orange",
  },
  {
    key: "APPROVED",
    title: "Approved",
    icon: CheckCircleOutlined,
    color: "var(--success)",
    tagColor: "success",
  },
  {
    key: "REJECTED",
    title: "Rejected",
    icon: CloseCircleOutlined,
    color: "var(--danger)",
    tagColor: "error",
  },
];

const OrderStats = ({ orders, loading }) => {
  if (loading && !orders) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  const byStatus = orders?.byStatus ?? {};
  const total = orders?.totalOrders ?? byStatus.total ?? 0;
  const denom = total || 1;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Total Orders"
              value={total}
              prefix={<ShoppingOutlined style={{ color: "var(--accent-color)" }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" title="Orders by status" style={{ marginBottom: 16 }}>
        <Space size={[8, 8]} wrap>
          {ORDER_STATUS_CONFIG.map(({ key, title, tagColor }) => (
            <Tag key={key} color={tagColor}>
              {title}: {byStatus[key] ?? 0}
            </Tag>
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {ORDER_STATUS_CONFIG.map(({ key, title, icon: Icon, color }) => {
          const count = byStatus[key] ?? 0;
          return (
            <Col key={key} xs={24} sm={12} lg={8} xl={6}>
              <Card size="small" style={{ height: "100%" }}>
                <Statistic
                  title={title}
                  value={count}
                  prefix={<Icon style={{ color }} />}
                />
                <Progress
                  percent={Math.round((count / denom) * 100)}
                  showInfo={false}
                  strokeColor={color}
                  size="small"
                  style={{ marginTop: 8 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {Math.round((count / denom) * 100)}% of all orders
                </Text>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default OrderStats;
