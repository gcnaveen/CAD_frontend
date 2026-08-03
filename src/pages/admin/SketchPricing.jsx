import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
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
import { ROLES, normalizeRoleKey, resolveStoredUserRole } from "../../constants/roles.js";
import {
  adminPricingFormValues,
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
  "sketchBalancePlanAmountRupees",
  "sketchBalanceDiscountRupees",
];

/** Client preview when editing a plan; otherwise server-resolved rupees. */
function displayPayable(plan, discount, resolvedTier) {
  const p = plan == null || plan === "" ? null : Number(plan);
  const d = Number(discount) || 0;
  if (p != null && Number.isFinite(p) && p > 0) {
    return Math.max(0, p - d);
  }
  if (resolvedTier?.payableRupees != null && Number.isFinite(Number(resolvedTier.payableRupees))) {
    return Math.max(0, Number(resolvedTier.payableRupees));
  }
  if (resolvedTier?.feePaise != null && Number.isFinite(Number(resolvedTier.feePaise))) {
    return Math.max(0, Number(resolvedTier.feePaise) / 100);
  }
  return 0;
}

function stripUndefined(obj) {
  const out = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

function formatSource(source) {
  if (!source) return null;
  const s = String(source).toLowerCase();
  if (s === "env") return "env fallback";
  if (s === "admin") return "admin plan";
  return source;
}

export default function SketchPricing() {
  const navigate = useNavigate();
  const roleFromRedux = useSelector((s) => s.auth?.role);
  const userRoleFromRedux = useSelector((s) => s.auth?.user?.role);
  const currentRole = normalizeRoleKey(
    resolveStoredUserRole(roleFromRedux, userRoleFromRedux)
  );
  const allowed = currentRole === ROLES.SUPER_ADMIN;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [baseline, setBaseline] = useState(null);
  const [resolved, setResolved] = useState(null);

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
      const fields = adminPricingFormValues(rec);
      setBaseline({ ...fields });
      setResolved(rec.resolved);
      form.setFieldsValue(fields);
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
  const balPlan = Form.useWatch("sketchBalancePlanAmountRupees", form);
  const balDisc = Form.useWatch("sketchBalanceDiscountRupees", form);

  const computed = useMemo(() => {
    return {
      uploadPayable: displayPayable(upPlan, upDisc, resolved?.upload),
      revisionPayable: displayPayable(revPlan, revDisc, resolved?.revision),
      balancePayable: displayPayable(balPlan, balDisc, resolved?.balance),
    };
  }, [upPlan, upDisc, revPlan, revDisc, balPlan, balDisc, resolved]);

  const onFinish = async (values) => {
    if (!baseline) {
      message.warning("Pricing not loaded yet");
      return;
    }
    setSaving(true);
    try {
      const patch = {};
      for (const k of FIELD_KEYS) {
        const nextRaw = values[k];
        const prevRaw = baseline[k];
        const next =
          nextRaw == null || nextRaw === "" ? null : Number(nextRaw);
        const prev =
          prevRaw == null || prevRaw === "" ? null : Number(prevRaw);
        const a = next != null && Number.isFinite(next) ? next : null;
        const b = prev != null && Number.isFinite(prev) ? prev : null;
        if (a !== b && a != null) patch[k] = a;
      }
      const body = stripUndefined(patch);
      if (Object.keys(body).length === 0) {
        message.info("No changes to save");
        return;
      }
      await patchAdminSurveySketchPricing(body);
      message.success("Sketch pricing updated");
      // Reload so payable/source come from server (not client math alone).
      await load();
    } catch (e) {
      message.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return null;

  const uploadSource = formatSource(resolved?.upload?.source);
  const revisionSource = formatSource(resolved?.revision?.source);
  const balanceSource = formatSource(resolved?.balance?.source);

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Sketch pricing
          </Title>
          <Text type="secondary">
            Configure survey sketch upload, revision, and CAD download balance amounts (rupees). Only
            changed fields are sent on save. Payable amounts are resolved by the server (admin plan, or
            env fallback when plan is unset).
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
                sketchUploadPlanAmountRupees: null,
                sketchUploadDiscountRupees: null,
                sketchRevisionPlanAmountRupees: null,
                sketchRevisionDiscountRupees: null,
                sketchBalancePlanAmountRupees: null,
                sketchBalanceDiscountRupees: null,
              }}
            >
              <Title level={5}>Upload pricing</Title>
              <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                Leave plan empty to use the server env fee. Discount applies only when
                a plan amount is set.
              </Text>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="sketchUploadPlanAmountRupees" label="Plan amount (₹)">
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="Unset (env fee)" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="sketchUploadDiscountRupees" label="Discount (₹)">
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
                  </Form.Item>
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 8 }}>
                Revision pricing
              </Title>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="sketchRevisionPlanAmountRupees" label="Plan amount (₹)">
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="Unset (env fee)" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="sketchRevisionDiscountRupees" label="Discount (₹)">
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
                  </Form.Item>
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 8 }}>
                CAD download balance (C-02)
              </Title>
              <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                Second payment after CAD delivery. Leave plan empty for env default, or set plan and
                discount so payable is 0 to waive the gate.
              </Text>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="sketchBalancePlanAmountRupees" label="Plan amount (₹)">
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="Unset (env fee)" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="sketchBalanceDiscountRupees" label="Discount (₹)">
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
                  </Form.Item>
                </Col>
              </Row>

              <Card
                size="small"
                type="inner"
                title="Resolved payable (from server)"
                style={{ marginBottom: 16 }}
                data-testid="resolved-payable"
              >
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text strong>Upload payable</Text>
                    {uploadSource ? (
                      <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                        source: {uploadSource}
                        {resolved?.upload?.feePaise != null
                          ? ` · ${resolved.upload.feePaise} paise`
                          : ""}
                      </Text>
                    ) : null}
                  </Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    ₹{computed.uploadPayable.toFixed(2)}
                  </Col>
                  <Col span={12}>
                    <Text strong>Revision payable</Text>
                    {revisionSource ? (
                      <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                        source: {revisionSource}
                      </Text>
                    ) : null}
                  </Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    ₹{computed.revisionPayable.toFixed(2)}
                  </Col>
                  <Col span={12}>
                    <Text strong>Balance payable</Text>
                    {balanceSource ? (
                      <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                        source: {balanceSource}
                      </Text>
                    ) : null}
                  </Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    ₹{computed.balancePayable.toFixed(2)}
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
