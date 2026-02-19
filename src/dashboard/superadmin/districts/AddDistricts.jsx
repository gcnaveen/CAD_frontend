import React from "react";
import { Form, Input, Button, Space, Typography } from "antd";

const { Title } = Typography;

const AddDistricts = ({ onCancel, onSubmit, loading = false }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    onSubmit?.(values);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel?.();
  };

  return (
    <div>
      <Title level={5} style={{ marginBottom: 24 }}>
        Add District
      </Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          name="code"
          label="Code"
          rules={[
            { required: true, message: "Please enter code" },
            { min: 2, message: "Code must be at least 2 characters" },
          ]}
        >
          <Input placeholder="e.g. KA-BLR" size="large" />
        </Form.Item>

        <Form.Item
          name="name"
          label="District Name"
          rules={[
            { required: true, message: "Please enter district name" },
            { min: 2, message: "District name must be at least 2 characters" },
          ]}
        >
          <Input placeholder="e.g. Bengaluru Urban" size="large" />
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

export default AddDistricts;
