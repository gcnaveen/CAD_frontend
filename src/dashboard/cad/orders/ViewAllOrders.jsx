import React, { useState } from "react";
import { Typography, Table, Button, Tag } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import OrderDetailDrawer from "./OrderDetailDrawer";
import { cadBi, cadBiFmt } from "../cadBilingual";

const { Title } = Typography;

const STATUS_TAG = {
  approved: { color: "green", text: cadBi.orders.historyStatus.approved },
  rejected: { color: "red", text: cadBi.orders.historyStatus.rejected },
  need_changes: { color: "orange", text: cadBi.orders.historyStatus.need_changes },
  pending: { color: "blue", text: cadBi.orders.historyStatus.pending },
};

const ViewAllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleViewDetails = (record) => {
    setSelectedOrder(record);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
  };

  const handleUploadCad = (orderId, files) => {
    const names = files.map((f) => ({ name: f.name, url: "#" }));
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, cadFiles: [...(o.cadFiles || []), ...names] }
          : o
      )
    );
    setSelectedOrder((prev) =>
      prev && prev.id === orderId
        ? { ...prev, cadFiles: [...(prev.cadFiles || []), ...names] }
        : prev
    );
  };

  const columns = [
    {
      title: cadBi.orders.slNo,
      key: "slNo",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: cadBi.orders.orderDate,
      dataIndex: "orderDate",
      key: "orderDate",
      width: 120,
      sorter: (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
    },
    {
      title: cadBi.orders.orderId,
      dataIndex: "orderId",
      key: "orderId",
      width: 120,
    },
    {
      title: cadBi.orders.customerName,
      dataIndex: "customerName",
      key: "customerName",
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },
    {
      title: cadBi.orders.phoneCol,
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 140,
    },
    {
      title: cadBi.orders.status,
      key: "status",
      width: 130,
      render: (_, record) => {
        const config = STATUS_TAG[record.status] || STATUS_TAG.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: cadBi.orders.historyStatus.approved, value: "approved" },
        { text: cadBi.orders.historyStatus.rejected, value: "rejected" },
        { text: cadBi.orders.historyStatus.need_changes, value: "need_changes" },
        { text: cadBi.orders.historyStatus.pending, value: "pending" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: cadBi.orders.action,
      key: "action",
      width: 140,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          {cadBi.orders.viewDetails}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        {cadBi.orders.historyTitle}
      </Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {cadBi.orders.historyIntro}
      </Typography.Paragraph>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => cadBiFmt(cadBi.orders.totalOrders, { n: total }),
        }}
        scroll={{ x: 800 }}
      />

      <OrderDetailDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        order={selectedOrder}
        onUploadCad={handleUploadCad}
        onSave
      />
    </div>
  );
};

export default ViewAllOrders;
