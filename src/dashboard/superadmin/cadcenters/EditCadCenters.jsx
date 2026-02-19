import React, { useEffect } from "react";
import { Form, Input, Button, Space, Typography, Select, InputNumber } from "antd";

const { Title } = Typography;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const EditCadCenters = ({ initialValues, onCancel, onSubmit, loading = false }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      const addr = initialValues.address ?? {};
      const contact = initialValues.contact ?? {};
      form.setFieldsValue({
        name: initialValues.name ?? "",
        code: initialValues.code ?? "",
        street: addr.street ?? "",
        city: addr.city ?? "",
        state: addr.state ?? "",
        pincode: addr.pincode ?? "",
        country: addr.country ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        alternatePhone: contact.alternatePhone ?? "",
        description: initialValues.description ?? "",
        status: initialValues.status ?? "ACTIVE",
        capacity: initialValues.capacity ?? 0,
      });
    }
  }, [initialValues, form]);

  const handleSubmit = (values) => {
    const payload = {
      name: values.name,
      code: values.code,
      address: {
        street: values.street || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        pincode: values.pincode || undefined,
        country: values.country || undefined,
      },
      contact: {
        email: values.email || undefined,
        phone: values.phone || undefined,
        alternatePhone: values.alternatePhone || undefined,
      },
      description: values.description || undefined,
      status: values.status ?? "ACTIVE",
      capacity: values.capacity ?? 0,
    };
    onSubmit?.(payload);
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel?.();
  };

  return (
    <div>
      <Title level={5} style={{ marginBottom: 24 }}>
        Edit CAD Center
      </Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[
            { required: true, message: "Please enter CAD center name" },
            { min: 2, message: "Name must be at least 2 characters" },
          ]}
        >
          <Input placeholder="CAD center name" size="large" />
        </Form.Item>

        <Form.Item
          name="code"
          label="Code"
          rules={[
            { required: true, message: "Please enter code" },
            { min: 2, message: "Code must be at least 2 characters" },
          ]}
        >
          <Input placeholder="e.g. BLR-CAD-001" size="large" />
        </Form.Item>

        <Form.Item name="street" label="Street">
          <Input placeholder="Street" size="large" />
        </Form.Item>

        <Form.Item name="city" label="City" rules={[{ required: true, message: "Please enter city" }]}>
          <Input placeholder="City" size="large" />
        </Form.Item>

        <Form.Item name="state" label="State">
          <Input placeholder="State" size="large" />
        </Form.Item>

        <Form.Item
          name="pincode"
          label="Pincode"
          rules={[{ pattern: /^\d{6}$/, message: "Pincode must be 6 digits" }]}
        >
          <Input placeholder="e.g. 560001" size="large" maxLength={6} />
        </Form.Item>

        <Form.Item name="country" label="Country">
          <Input placeholder="Country" size="large" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please enter email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="Email" size="large" type="email" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone"
          rules={[
            { required: true, message: "Please enter phone" },
            {
              pattern: /^[\d\s\-+()]{10,}$/,
              message: "Please enter a valid phone number",
            },
          ]}
        >
          <Input placeholder="Phone" size="large" />
        </Form.Item>

        <Form.Item name="alternatePhone" label="Alternate Phone">
          <Input placeholder="Alternate phone" size="large" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea placeholder="Description" rows={3} size="large" />
        </Form.Item>

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select placeholder="Status" size="large" options={STATUS_OPTIONS} />
        </Form.Item>

        <Form.Item name="capacity" label="Capacity">
          <InputNumber min={0} placeholder="Capacity" style={{ width: "100%" }} size="large" />
        </Form.Item>

        <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
          <Space size="middle">
            <Button type="primary" htmlType="submit" size="large" loading={loading}>
              Update
            </Button>
            <Button size="large" onClick={handleCancel}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EditCadCenters;
