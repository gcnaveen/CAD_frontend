import React, { useEffect, useState } from "react";
import { Form, Input, Button, Space, Typography, Select } from "antd";
import { getDistricts } from "../../../services/masters/districtService.js";

const { Title } = Typography;

function normalizeList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}

const AddTalukas = ({ onCancel, onSubmit, loading = false, districtId }) => {
  const [form] = Form.useForm();
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    getDistricts()
      .then((res) => setDistricts(normalizeList(res)))
      .catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    if (districtId) form.setFieldValue("district", districtId);
  }, [districtId, form]);

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
        Add Taluka
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
          <Input placeholder="e.g. BLR-N" size="large" />
        </Form.Item>

        <Form.Item
          name="name"
          label="Taluka Name"
          rules={[
            { required: true, message: "Please enter taluka name" },
            { min: 2, message: "Taluka name must be at least 2 characters" },
          ]}
        >
          <Input placeholder="e.g. Bengaluru North" size="large" />
        </Form.Item>

        <Form.Item
          name="district"
          label="District"
          rules={[{ required: true, message: "Please select district" }]}
        >
          <Select
            placeholder="Select district"
            size="large"
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={districts.map((d) => ({
              value: d._id ?? d.id,
              label: d.code ? `${d.name} (${d.code})` : d.name,
            }))}
          />
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

export default AddTalukas;
