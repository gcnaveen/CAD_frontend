import React, { useState } from "react";
import { Typography, Table, Button, Tag } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import ProjectOrderDetailDrawer from "./ProjectOrderDetailDrawer";
import { DUMMY_PROJECT_HISTORY } from "./projectOrdersData";

const { Title } = Typography;

const STATUS_TAG_MAP = {
  approved: { color: "green", text: "Completed" },
  rejected: { color: "red", text: "Rejected" },
  need_changes: { color: "orange", text: "Need Changes" },
};

const ViewProjectHistory = () => {
  const [orders, setOrders] = useState(DUMMY_PROJECT_HISTORY);
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

  const handleSaveOrder = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    setSelectedOrder(updatedOrder);
  };

  const columns = [
    {
      title: "Sl. No",
      key: "slNo",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Ordered Date",
      dataIndex: "orderDate",
      key: "orderDate",
      width: 120,
      sorter: (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 160,
    },
    {
      title: "Status",
      key: "status",
      width: 140,
      render: (_, record) => {
        const config = STATUS_TAG_MAP[record.status] || STATUS_TAG_MAP.approved;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: "Completed", value: "approved" },
        { text: "Rejected", value: "rejected" },
        { text: "Need Changes", value: "need_changes" },
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
        View Project History
      </Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Completed, pending, and rejected projects with full order details.
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
        scroll={{ x: 700 }}
      />

      <ProjectOrderDetailDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        order={selectedOrder}
        onSave={handleSaveOrder}
        readOnly={false}
      />
    </div>
  );
};

export default ViewProjectHistory;
