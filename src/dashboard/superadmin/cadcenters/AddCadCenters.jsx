import React from "react";
import { Form, Input, Button, Space, Typography } from "antd";

const { Title } = Typography;

const AddCadCenters = ({ onCancel, onSubmit, loading = false }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    const payload = {
      name: values.name,
      code: values.code,
      address: {
        city: values.city ?? "",
        pincode: values.pincode ?? "",
      },
      contact: {
        email: values.email ?? "",
        phone: values.phone ?? "",
      },
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
        Add CAD Center
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
          <Input placeholder="e.g. Bangalore CAD Center" size="large" />
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

        <Form.Item
          name="city"
          label="City"
          rules={[{ required: true, message: "Please enter city" }]}
        >
          <Input placeholder="Enter city" size="large" />
        </Form.Item>

        <Form.Item
          name="pincode"
          label="Pincode"
          rules={[
            { required: true, message: "Please enter pincode" },
            { pattern: /^\d{6}$/, message: "Pincode must be 6 digits" },
          ]}
        >
          <Input placeholder="e.g. 560001" size="large" maxLength={6} />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please enter email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="e.g. blr@cad.com" size="large" type="email" />
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
          <Input placeholder="e.g. +91-80-12345678" size="large" />
        </Form.Item>

        <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
          <Space size="middle">
            <Button type="primary" htmlType="submit" size="large" loading={loading}>
              Submit
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

export default AddCadCenters;
