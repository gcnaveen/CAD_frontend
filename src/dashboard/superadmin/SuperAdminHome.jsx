import React from "react";
import { Tabs, Typography } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import UserStats from "./home/UserStats";
import DraftStats from "./home/DraftStats";
import OrderStats from "./home/OrderStats";
import PaymentStats from "./home/PaymentStats";

const { Title } = Typography;

const SuperAdminHome = () => {
  const tabItems = [
    {
      key: "users",
      label: (
        <span>
          <UserOutlined /> Users
        </span>
      ),
      children: <UserStats />,
    },
    {
      key: "drafts",
      label: (
        <span>
          <FileTextOutlined /> Drafts
        </span>
      ),
      children: <DraftStats />,
    },
    {
      key: "orders",
      label: (
        <span>
          <ShoppingOutlined /> Orders
        </span>
      ),
      children: <OrderStats />,
    },
    {
      key: "payments",
      label: (
        <span>
          <DollarOutlined /> Payments
        </span>
      ),
      children: <PaymentStats />,
    },
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        Dashboard overview
      </Title>
      <Tabs defaultActiveKey="users" items={tabItems} size="large" />
    </div>
  );
};

export default SuperAdminHome;
