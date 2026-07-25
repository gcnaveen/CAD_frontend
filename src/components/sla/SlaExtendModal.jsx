import React from "react";
import { Form, Input, InputNumber, Modal, Radio, Typography, message } from "antd";
import { extendAssignmentSla } from "../../services/assignmentApi.js";

const { Text } = Typography;

/**
 * Admin: POST .../sla-extend with { hours, reason } or { ms, reason }.
 */
export default function SlaExtendModal({
  open,
  assignmentId,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);
  const mode = Form.useWatch("mode", form) || "hours";

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue({
        mode: "hours",
        hours: 6,
        ms: undefined,
        reason: "",
      });
    }
  }, [open, form]);

  const handleOk = async () => {
    if (!assignmentId) {
      message.error("Missing assignment id");
      return;
    }
    try {
      const values = await form.validateFields();
      const reason = String(values.reason || "").trim();
      if (!reason) {
        message.error("Reason is required");
        return;
      }
      const body =
        values.mode === "ms"
          ? { ms: Number(values.ms), reason }
          : { hours: Number(values.hours), reason };

      setSubmitting(true);
      const result = await extendAssignmentSla(assignmentId, body);
      message.success("SLA extended");
      onSuccess?.(result);
      onClose?.();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || "Failed to extend SLA");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Extend SLA"
      open={open}
      onCancel={() => onClose?.()}
      onOk={handleOk}
      confirmLoading={submitting}
      okText="Extend"
      destroyOnClose
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
        Extends the server-authoritative deadline. Client due dates are ignored.
      </Text>
      <Form form={form} layout="vertical" initialValues={{ mode: "hours", hours: 6 }}>
        <Form.Item name="mode" label="Extend by">
          <Radio.Group>
            <Radio.Button value="hours">Hours</Radio.Button>
            <Radio.Button value="ms">Milliseconds</Radio.Button>
          </Radio.Group>
        </Form.Item>
        {mode === "ms" ? (
          <Form.Item
            name="ms"
            label="Milliseconds"
            rules={[{ required: true, message: "Enter milliseconds" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 21600000" />
          </Form.Item>
        ) : (
          <Form.Item
            name="hours"
            label="Hours"
            rules={[{ required: true, message: "Enter hours" }]}
          >
            <InputNumber min={1} max={168} style={{ width: "100%" }} />
          </Form.Item>
        )}
        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: "Reason is required" }]}
        >
          <Input.TextArea rows={3} placeholder="Why is this extension needed?" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
