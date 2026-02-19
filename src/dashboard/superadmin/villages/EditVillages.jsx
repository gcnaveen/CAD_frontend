import React, { useEffect, useState } from "react";
import { Form, Input, Button, Space, Typography, Select } from "antd";
import { getDistricts } from "../../../services/masters/districtService.js";
import { getTalukasByDistrict } from "../../../services/masters/talukaService.js";
import { getHoblisByTaluka } from "../../../services/masters/hobliService.js";

const { Title } = Typography;

function normalizeList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}

const labelDistrict = (d) => (d.code ? `${d.name} (${d.code})` : d.name);
const labelTaluka = (t) => (t.code ? `${t.name} (${t.code})` : t.name);
const labelHobli = (h) => (h.code ? `${h.name} (${h.code})` : h.name);

const EditVillages = ({ initialValues, onCancel, onSubmit, loading = false }) => {
  const [form] = Form.useForm();
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [hoblis, setHoblis] = useState([]);

  useEffect(() => {
    getDistricts()
      .then((res) => setDistricts(normalizeList(res)))
      .catch(() => setDistricts([]));
  }, []);

  const selectedDistrict = Form.useWatch("district", form);
  const selectedTaluka = Form.useWatch("taluka", form);

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
    if (!selectedTaluka) {
      setHoblis([]);
      return;
    }
    getHoblisByTaluka(selectedTaluka)
      .then((res) => setHoblis(normalizeList(res)))
      .catch(() => setHoblis([]));
  }, [selectedTaluka]);

  useEffect(() => {
    if (initialValues && districts.length) {
      let districtId =
        initialValues.district ??
        initialValues.districtId ??
        initialValues.district?._id ??
        initialValues.district?.id;
      if (
        typeof districtId === "string" &&
        !districtId.match(/^[0-9a-fA-F]{24}$/)
      ) {
        const byName = districts.find(
          (d) => d.name === districtId || labelDistrict(d) === districtId
        );
        districtId = byName?._id ?? byName?.id ?? districtId;
      }
      let talukaVal =
        initialValues.taluka ??
        initialValues.talukaId ??
        initialValues.taluka?._id ??
        initialValues.taluka?.id;
      let hobliVal =
        initialValues.hobli ??
        initialValues.hobliId ??
        initialValues.hobli?._id ??
        initialValues.hobli?.id;
      form.setFieldsValue({
        code: initialValues.code,
        name: initialValues.name,
        district: districtId,
        taluka: talukaVal,
        hobli: hobliVal,
      });
      if (districtId) {
        getTalukasByDistrict(districtId)
          .then((res) => setTalukas(normalizeList(res)))
          .catch(() => setTalukas([]));
      }
    }
  }, [initialValues, form, districts]);

  useEffect(() => {
    if (initialValues && talukas.length && form.getFieldValue("taluka")) {
      const talukaVal = form.getFieldValue("taluka");
      if (
        typeof talukaVal === "string" &&
        !talukaVal.match(/^[0-9a-fA-F]{24}$/)
      ) {
        const byName = talukas.find(
          (t) => t.name === talukaVal || labelTaluka(t) === talukaVal
        );
        if (byName) form.setFieldValue("taluka", byName._id ?? byName.id);
      }
    }
  }, [initialValues, talukas, form]);

  useEffect(() => {
    if (initialValues && hoblis.length && form.getFieldValue("hobli")) {
      const hobliVal = form.getFieldValue("hobli");
      if (
        typeof hobliVal === "string" &&
        !hobliVal.match(/^[0-9a-fA-F]{24}$/)
      ) {
        const byName = hoblis.find(
          (h) => h.name === hobliVal || labelHobli(h) === hobliVal
        );
        if (byName) form.setFieldValue("hobli", byName._id ?? byName.id);
      }
    }
  }, [initialValues, hoblis, form]);

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
        Edit Village
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
          <Input placeholder="e.g. VIL-001" size="large" />
        </Form.Item>

        <Form.Item
          name="name"
          label="Village Name"
          rules={[
            { required: true, message: "Please enter village name" },
            { min: 2, message: "Village name must be at least 2 characters" },
          ]}
        >
          <Input placeholder="e.g. Hebbal Village" size="large" />
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
              label: labelDistrict(d),
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
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={talukas.map((t) => ({
              value: t._id ?? t.id,
              label: labelTaluka(t),
            }))}
          />
        </Form.Item>

        <Form.Item
          name="hobli"
          label="Hobli"
          rules={[{ required: true, message: "Please select hobli" }]}
        >
          <Select
            placeholder="Select hobli"
            size="large"
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={hoblis.map((h) => ({
              value: h._id ?? h.id,
              label: labelHobli(h),
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

export default EditVillages;
