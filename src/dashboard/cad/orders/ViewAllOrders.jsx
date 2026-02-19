import React, { useState } from "react";
import { Typography, Table, Button, Tag } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import OrderDetailDrawer from "./OrderDetailDrawer";

const { Title } = Typography;

const STATUS_TAG = {
  approved: { color: "green", text: "Approved" },
  rejected: { color: "red", text: "Rejected" },
  need_changes: { color: "orange", text: "Need Changes" },
  pending: { color: "blue", text: "Pending" },
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
      title: "Sl. No",
      key: "slNo",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Order Date",
      dataIndex: "orderDate",
      key: "orderDate",
      width: 120,
      sorter: (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      width: 120,
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      key: "customerName",
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 140,
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      render: (_, record) => {
        const config = STATUS_TAG[record.status] || STATUS_TAG.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: "Approved", value: "approved" },
        { text: "Rejected", value: "rejected" },
        { text: "Need Changes", value: "need_changes" },
        { text: "Pending", value: "pending" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        View Order History
      </Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        All orders (current, completed, and rejected). View details and upload
        CAD files where applicable.
      </Typography.Paragraph>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} orders`,
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
