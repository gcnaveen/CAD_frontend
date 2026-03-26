import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Typography,
  Divider,
  Button,
} from "antd";
import {
  WalletOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const Wallet = () => {
  // Simulated data - replace with actual API call
  const mockData = {
    pendingPayment: 25000,
    receivedPayment: 75000,
  };

  const mockTransactions = [
    {
      key: "1",
      orderId: "ORD-2024-001",
      projectName: "Survey Project Alpha",
      amount: 15000,
      status: "received",
      date: "2024-02-01",
      paymentDate: "2024-02-05",
    },
    {
      key: "2",
      orderId: "ORD-2024-002",
      projectName: "Survey Project Beta",
      amount: 20000,
      status: "received",
      date: "2024-01-28",
      paymentDate: "2024-02-03",
    },
    {
      key: "3",
      orderId: "ORD-2024-003",
      projectName: "Survey Project Gamma",
      amount: 12000,
      status: "pending",
      date: "2024-02-03",
      paymentDate: null,
    },
    {
      key: "4",
      orderId: "ORD-2024-004",
      projectName: "Survey Project Delta",
      amount: 18000,
      status: "received",
      date: "2024-01-25",
      paymentDate: "2024-01-30",
    },
    {
      key: "5",
      orderId: "ORD-2024-005",
      projectName: "Survey Project Epsilon",
      amount: 13000,
      status: "pending",
      date: "2024-02-04",
      paymentDate: null,
    },
  ];

  const [walletData] = useState({
    pendingPayment: mockData.pendingPayment,
    receivedPayment: mockData.receivedPayment,
    totalPayment: mockData.pendingPayment + mockData.receivedPayment,
  });

  const [transactions] = useState(mockTransactions);

  // TODO: Replace with actual API call
  // useEffect(() => {
  //   fetchWalletData().then(data => {
  //     setWalletData({
  //       pendingPayment: data.pendingPayment,
  //       receivedPayment: data.receivedPayment,
  //       totalPayment: data.pendingPayment + data.receivedPayment,
  //     });
  //     setTransactions(data.transactions);
  //   });
  // }, []);

  const columns = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Project Name",
      dataIndex: "projectName",
      key: "projectName",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <Text strong style={{ color: "var(--accent-color)" }}>
          ₹{amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: "Order Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Payment Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      render: (date) => (date ? date : <Text type="secondary">Pending</Text>),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          icon={
            status === "received" ? (
              <CheckCircleOutlined />
            ) : (
              <ClockCircleOutlined />
            )
          }
          color={status === "received" ? "success" : "warning"}
        >
          {status === "received" ? "Received" : "Pending"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            style={{ padding: 0 }}
          >
            View
          </Button>
          {record.status === "received" && (
            <Button
              type="link"
              icon={<DownloadOutlined />}
              size="small"
              style={{ padding: 0 }}
            >
              Invoice
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
      <div style={{ padding: "0px" }}>
        <Title level={2} style={{ marginBottom: 24 }}>
          <WalletOutlined style={{ marginRight: 12, color: "var(--accent-color)" }} />
          Wallet
        </Title>

        {/* Payment Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={24} md={8}>
            <Card
              bordered={false}
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--warning) 88%, white) 0%, var(--warning) 100%)",
                boxShadow: "0 4px 12px color-mix(in srgb, var(--warning) 35%, transparent)",
              }}
            >
              <Statistic
                title={
                  <Text style={{ color: "white", fontSize: 14 }}>
                    Pending Payment
                  </Text>
                }
                value={walletData.pendingPayment}
                prefix={<ClockCircleOutlined style={{ color: "white" }} />}
                suffix={<span style={{ color: "white" }}>₹</span>}
                valueStyle={{ color: "white", fontSize: 28, fontWeight: 700 }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={24} md={8}>
            <Card
              bordered={false}
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--success) 92%, black) 0%, var(--success) 100%)",
                boxShadow: "0 4px 12px color-mix(in srgb, var(--success) 35%, transparent)",
              }}
            >
              <Statistic
                title={
                  <Text style={{ color: "white", fontSize: 14 }}>
                    Received Payment
                  </Text>
                }
                value={walletData.receivedPayment}
                prefix={<CheckCircleOutlined style={{ color: "white" }} />}
                suffix={<span style={{ color: "white" }}>₹</span>}
                valueStyle={{ color: "white", fontSize: 28, fontWeight: 700 }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={24} md={8}>
            <Card
              bordered={false}
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 75%, black) 100%)",
                boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-color) 35%, transparent)",
              }}
            >
              <Statistic
                title={
                  <Text style={{ color: "white", fontSize: 14 }}>
                    Total Payment
                  </Text>
                }
                value={walletData.totalPayment}
                prefix={<DollarOutlined style={{ color: "white" }} />}
                suffix={<span style={{ color: "white" }}>₹</span>}
                valueStyle={{ color: "white", fontSize: 28, fontWeight: 700 }}
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 12,
                  display: "block",
                  marginTop: 8,
                }}
              >
                Pending + Received
              </Text>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Transaction History */}
        <Card
          title={
            <Title level={4} style={{ margin: 0 }}>
              Transaction History
            </Title>
          }
          bordered={false}
          style={{ boxShadow: "0 1px 3px var(--homepage-card-shadow)" }}
        >
          <Table
            columns={columns}
            dataSource={transactions}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} transactions`,
            }}
            scroll={{ x: 800 }}
          />
        </Card>
      </div>
  );
};

export default Wallet;
