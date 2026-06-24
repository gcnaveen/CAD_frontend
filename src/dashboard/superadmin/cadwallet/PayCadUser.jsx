import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { ROLES } from "../../../constants/roles.js";
import { getCadUsers, formatUserDisplayLabel } from "../../../services/assignmentApi.js";
import { payCadUser } from "../../../services/admin/cadWalletAdminService.js";

const { Title, Text } = Typography;

function getCurrentRole(roleFromRedux) {
  if (roleFromRedux) return roleFromRedux;
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored)?.role : null;
  } catch {
    return null;
  }
}

const formatRs = (n) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PayCadUser() {
  const navigate = useNavigate();
  const roleFromRedux = useSelector((s) => s.auth?.role);
  const currentRole = getCurrentRole(roleFromRedux);
  const allowed = currentRole === ROLES.SUPER_ADMIN;

  const [form] = Form.useForm();
  const [cadUsers, setCadUsers] = useState([]);
  const [cadUsersLoading, setCadUsersLoading] = useState(false);
  const [cadUsersError, setCadUsersError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!allowed) {
      navigate("/superadmin/home", { replace: true });
    }
  }, [allowed, navigate]);

  const loadCadUsers = useCallback(async () => {
    if (!allowed) return;
    setCadUsersLoading(true);
    setCadUsersError("");
    try {
      const users = await getCadUsers();
      setCadUsers(users);
    } catch (e) {
      const msg = e?.message || "Failed to load CAD users";
      setCadUsersError(msg);
      message.error(msg);
      setCadUsers([]);
    } finally {
      setCadUsersLoading(false);
    }
  }, [allowed]);

  useEffect(() => {
    loadCadUsers();
  }, [loadCadUsers]);

  const onFinish = async (values) => {
    const cadUserId = values.cadUserId;
    const amountRupees = Number(values.amountRupees);
    if (!cadUserId) {
      message.error("Please select a CAD user");
      return;
    }
    if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
      message.error("Amount must be greater than 0");
      return;
    }

    const amountPaise = Math.round(amountRupees * 100);
    setSubmitting(true);
    try {
      const data = await payCadUser({ cadUserId, amountPaise });
      setResult(data);
      message.success("Payment applied successfully");
    } catch (e) {
      message.error(e?.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!allowed) return null;

  const cadOptions = cadUsers.map((u) => {
    const id = u._id ?? u.id;
    return {
      value: id,
      label: formatUserDisplayLabel(u) || u.email || id,
    };
  });

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <WalletOutlined style={{ marginRight: 10, color: "var(--accent-color)" }} />
            Pay CAD User
          </Title>
          <Text type="secondary">
            Apply a lump-sum payment against a CAD user&apos;s pending wallet entries.
          </Text>
        </div>

        {cadUsersError ? (
          <Alert
            type="error"
            message={cadUsersError}
            showIcon
            action={<Button onClick={loadCadUsers}>Retry</Button>}
          />
        ) : null}

        <Spin spinning={cadUsersLoading}>
          <Card>
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="cadUserId"
                    label="CAD User"
                    rules={[{ required: true, message: "Select a CAD user" }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select CAD user"
                      loading={cadUsersLoading}
                      options={cadOptions}
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        String(option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="amountRupees"
                    label="Amount (₹)"
                    rules={[
                      { required: true, message: "Enter amount" },
                      {
                        validator: (_, v) => {
                          const n = Number(v);
                          if (!Number.isFinite(n) || n <= 0) {
                            return Promise.reject(new Error("Amount must be greater than 0"));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      min={0.01}
                      step={0.01}
                      style={{ width: "100%" }}
                      placeholder="Amount in rupees"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Button type="primary" htmlType="submit" loading={submitting} disabled={submitting}>
                Pay User
              </Button>
            </Form>
          </Card>
        </Spin>

        {result ? (
          <Card title="Payment result">
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} md={8}>
                <Statistic
                  title="Total Earnings"
                  value={result.summary.totalEarningsRupees}
                  prefix={<DollarOutlined />}
                  suffix="₹"
                  precision={2}
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title="Received Payment"
                  value={result.summary.receivedPaymentRupees}
                  prefix={<CheckCircleOutlined />}
                  suffix="₹"
                  precision={2}
                  valueStyle={{ color: "var(--success, #52c41a)" }}
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title="Pending Payment"
                  value={result.summary.pendingPaymentRupees}
                  prefix={<ClockCircleOutlined />}
                  suffix="₹"
                  precision={2}
                  valueStyle={{ color: "var(--warning, #faad14)" }}
                />
              </Col>
            </Row>

            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Applied amount">
                {formatRs(result.appliedAmountRupees)}
              </Descriptions.Item>
              <Descriptions.Item label="Unapplied amount">
                {formatRs(result.unappliedAmountRupees)}
              </Descriptions.Item>
              <Descriptions.Item label="Entries updated" span={2}>
                {result.touchedEntryIds.length} entries updated
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ) : null}
      </Space>
    </div>
  );
}
