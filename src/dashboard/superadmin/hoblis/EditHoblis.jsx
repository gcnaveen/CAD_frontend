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

const EditHoblis = ({ initialValues, onCancel, onSubmit, loading = false }) => {
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
    // Ensure selectedDistrict is a string ID, not an object
    const districtIdStr = typeof selectedDistrict === "string" 
      ? selectedDistrict 
      : selectedDistrict?._id ?? selectedDistrict?.id ?? String(selectedDistrict);
    if (!districtIdStr || districtIdStr === "[object Object]") {
      setTalukas([]);
      return;
    }
    getTalukasByDistrict(districtIdStr)
      .then((res) => setTalukas(normalizeList(res)))
      .catch(() => setTalukas([]));
  }, [selectedDistrict]);

  useEffect(() => {
    if (initialValues && districts.length) {
      let districtId = initialValues.district ?? initialValues.districtId ?? initialValues.district?._id ?? initialValues.district?.id;
      // If districtId is an object, extract the ID
      if (districtId && typeof districtId === "object") {
        districtId = districtId._id ?? districtId.id ?? null;
      }
      // If it's a string but not an ObjectId, try to find by name
      if (typeof districtId === "string" && !districtId.match(/^[0-9a-fA-F]{24}$/)) {
        const byName = districts.find((d) => d.name === districtId);
        districtId = byName?._id ?? byName?.id ?? districtId;
      }
      // Ensure districtId is a string before setting
      const districtIdStr = districtId && typeof districtId === "object" 
        ? (districtId._id ?? districtId.id ?? null)
        : String(districtId || "");
      
      let talukaVal = initialValues.taluka ?? initialValues.talukaId ?? initialValues.taluka?._id ?? initialValues.taluka?.id;
      // Ensure talukaVal is a string ID, not an object
      if (talukaVal && typeof talukaVal === "object") {
        talukaVal = talukaVal._id ?? talukaVal.id ?? null;
      }
      const talukaValStr = talukaVal && typeof talukaVal === "object"
        ? (talukaVal._id ?? talukaVal.id ?? null)
        : String(talukaVal || "");
      
      form.setFieldsValue({
        code: initialValues.code,
        name: initialValues.name,
        taluka: talukaValStr || undefined,
        district: districtIdStr || undefined,
      });
      if (districtIdStr && districtIdStr !== "[object Object]") {
        getTalukasByDistrict(districtIdStr)
          .then((res) => setTalukas(normalizeList(res)))
          .catch(() => setTalukas([]));
      }
    }
  }, [initialValues, form, districts]);

  useEffect(() => {
    if (initialValues && talukas.length && form.getFieldValue("taluka")) {
      const talukaVal = form.getFieldValue("taluka");
      if (typeof talukaVal === "string" && !talukaVal.match(/^[0-9a-fA-F]{24}$/)) {
        const byName = talukas.find((t) => t.name === talukaVal);
        if (byName) form.setFieldValue("taluka", byName._id ?? byName.id);
      }
    }
  }, [initialValues, talukas, form]);

  const handleSubmit = (values) => {
    onSubmit?.(values);
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel?.();
  };

  return (
    <div>
      <Title level={5} style={{ marginBottom: 24 }}>
        Edit Hobli
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

export default EditHoblis;
