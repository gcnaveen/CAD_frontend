import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import { ROLES } from "../../constants/roles.js";
import {
  getAdminSurveySketchPricing,
  normalizeAdminSketchPricingRecord,
  patchAdminSurveySketchPricing,
} from "../../services/admin/sketchPricingAdminService.js";

const { Title, Text } = Typography;

const FIELD_KEYS = [
  "sketchUploadPlanAmountRupees",
  "sketchUploadDiscountRupees",
  "sketchRevisionPlanAmountRupees",
  "sketchRevisionDiscountRupees",
];

function getCurrentRole(roleFromRedux) {
  if (roleFromRedux) return roleFromRedux;
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored)?.role : null;
  } catch {
    return null;
  }
}

function payable(plan, discount) {
  const p = Number(plan) || 0;
  const d = Number(discount) || 0;
  return Math.max(0, p - d);
}

function stripUndefined(obj) {
  const out = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

export default function SketchPricing() {
  const navigate = useNavigate();
  const roleFromRedux = useSelector((s) => s.auth?.role);
  const currentRole = getCurrentRole(roleFromRedux);
  const allowed = currentRole === ROLES.SUPER_ADMIN;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [baseline, setBaseline] = useState(null);

  useEffect(() => {
    if (!allowed) {
      navigate("/superadmin/home", { replace: true });
    }
  }, [allowed, navigate]);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setLoadError("");
    try {
      const raw = await getAdminSurveySketchPricing();
      const rec = normalizeAdminSketchPricingRecord(raw);
      setBaseline({ ...rec });
      form.setFieldsValue(rec);
    } catch (e) {
      setLoadError(e?.message || "Failed to load pricing");
      message.error(e?.message || "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, [allowed, form]);

  useEffect(() => {
    load();
  }, [load]);

  const upPlan = Form.useWatch("sketchUploadPlanAmountRupees", form);
  const upDisc = Form.useWatch("sketchUploadDiscountRupees", form);
  const revPlan = Form.useWatch("sketchRevisionPlanAmountRupees", form);
  const revDisc = Form.useWatch("sketchRevisionDiscountRupees", form);

  const computed = useMemo(() => {
    return {
      uploadPayable: payable(upPlan, upDisc),
      revisionPayable: payable(revPlan, revDisc),
    };
  }, [upPlan, upDisc, revPlan, revDisc]);

  const onFinish = async (values) => {
    if (!baseline) {
      message.warning("Pricing not loaded yet");
      return;
    }
    setSaving(true);
    try {
      const patch = {};
      for (const k of FIELD_KEYS) {
        const next = Number(values[k]);
        const prev = Number(baseline[k]);
        const a = Number.isFinite(next) ? next : 0;
        const b = Number.isFinite(prev) ? prev : 0;
        if (a !== b) patch[k] = a;
      }
      const body = stripUndefined(patch);
      if (Object.keys(body).length === 0) {
        message.info("No changes to save");
        return;
      }
      await patchAdminSurveySketchPricing(body);
      const nextBaseline = { ...baseline, ...body };
      setBaseline(nextBaseline);
      form.setFieldsValue(nextBaseline);
      message.success("Sketch pricing updated");
    } catch (e) {
      message.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return null;

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Sketch pricing
          </Title>
          <Text type="secondary">
            Configure survey sketch upload and revision amounts (rupees). Only changed fields are sent on save.
          </Text>
        </div>

        {loadError ? (
          <Alert type="error" message={loadError} showIcon action={<Button onClick={load}>Retry</Button>} />
        ) : null}

        <Spin spinning={loading}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                sketchUploadPlanAmountRupees: 0,
                sketchUploadDiscountRupees: 0,
                sketchRevisionPlanAmountRupees: 0,
                sketchRevisionDiscountRupees: 0,
              }}
            >
              <Title level={5}>Upload pricing</Title>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="sketchUploadPlanAmountRupees"
                    label="Plan amount (₹)"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="sketchUploadDiscountRupees"
                    label="Discount (₹)"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
                  </Form.Item>
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 8 }}>
                Revision pricing
              </Title>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="sketchRevisionPlanAmountRupees"
                    label="Plan amount (₹)"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="sketchRevisionDiscountRupees"
                    label="Discount (₹)"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
                  </Form.Item>
                </Col>
              </Row>

              <Card size="small" type="inner" title="Computed payable (preview)" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text strong>Upload payable</Text>
                  </Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    ₹{computed.uploadPayable.toFixed(2)}
                  </Col>
                  <Col span={12}>
                    <Text strong>Revision payable</Text>
                  </Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    ₹{computed.revisionPayable.toFixed(2)}
                  </Col>
                </Row>
              </Card>

              <Button type="primary" htmlType="submit" loading={saving} disabled={saving || loading || !baseline}>
                Save changes
              </Button>
            </Form>
          </Card>
        </Spin>
      </Space>
    </div>
  );
}
