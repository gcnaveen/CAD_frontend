import React, { useEffect, useState } from "react";
import { Form, Input, Button, Space, Typography, Select } from "antd";
import { getDistricts } from "../../../services/masters/districtService.js";
import { getTalukasByDistrict } from "../../../services/masters/talukaService.js";

const { Title } = Typography;

function normalizeList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}

const AddHoblis = ({ onCancel, onSubmit, loading = false, talukaId, districtId }) => {
  const [form] = Form.useForm();
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);

  useEffect(() => {
    getDistricts()
      .then((res) => setDistricts(normalizeList(res)))
      .catch(() => setDistricts([]));
  }, []);

  const selectedDistrict = Form.useWatch("district", form);

  useEffect(() => {
    if (!selectedDistrict) {
      setTalukas([]);
      return;
    }
    getTalukasByDistrict(selectedDistrict)
      .then((res) => setTalukas(normalizeList(res)))
      .catch(() => setTalukas([]));
  }, [selectedDistrict]);

  useEffect(() => {
    if (districtId) form.setFieldValue("district", districtId);
    if (talukaId) form.setFieldValue("taluka", talukaId);
  }, [districtId, talukaId, form]);

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
        Add Hobli
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
          <Input placeholder="e.g. HEBBAL" size="large" />
        </Form.Item>

        <Form.Item
          name="name"
          label="Hobli Name"
          rules={[
            { required: true, message: "Please enter hobli name" },
            { min: 2, message: "Hobli name must be at least 2 characters" },
          ]}
        >
          <Input placeholder="e.g. Hebbal" size="large" />
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
            options={districts.map((d) => ({
              value: d._id ?? d.id,
              label: d.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="taluka"
          label="Taluka"
          rules={[{ required: true, message: "Please select taluka" }]}
        >
          <Select
            placeholder="Select taluka"
            size="large"
            showSearch
            optionFilterProp="label"
            options={talukas.map((t) => ({
              value: t._id ?? t.id,
              label: t.name,
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

export default AddHoblis;
