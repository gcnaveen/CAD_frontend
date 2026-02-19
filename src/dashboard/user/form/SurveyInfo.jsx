import React, { useEffect, useState } from "react";
import { Form, Select, Input, message } from "antd";
import { getDistricts } from "../../../services/masters/districtService.js";
import { getTalukasByDistrict } from "../../../services/masters/talukaService.js";
import { getHoblisByTaluka } from "../../../services/masters/hobliService.js";
import { getVillages } from "../../../services/masters/villageService.js";

const { Option } = Select;

function normalizeList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}

const SurveyInfo = ({ form }) => {
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [hoblis, setHoblis] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState({ districts: false, talukas: false, hoblis: false, villages: false });

  const district = Form.useWatch("district", form);
  const taluka = Form.useWatch("taluka", form);
  const hobli = Form.useWatch("hobli", form);

  // Load districts on mount
  useEffect(() => {
    setLoading((prev) => ({ ...prev, districts: true }));
    getDistricts()
      .then((res) => {
        const items = normalizeList(res);
        setDistricts(items.map((r) => ({ ...r, id: r.id ?? r._id })));
      })
      .catch((err) => {
        message.error(err.message || "Failed to load districts");
        setDistricts([]);
      })
      .finally(() => setLoading((prev) => ({ ...prev, districts: false })));
  }, []);

  // Load talukas when district changes
  useEffect(() => {
    if (!district) {
      setTalukas([]);
      form.setFieldsValue({ taluka: undefined, hobli: undefined, village: undefined });
      return;
    }
    setLoading((prev) => ({ ...prev, talukas: true }));
    getTalukasByDistrict(district)
      .then((res) => {
        const items = normalizeList(res);
        setTalukas(items.map((r) => ({ ...r, id: r.id ?? r._id })));
      })
      .catch((err) => {
        message.error(err.message || "Failed to load talukas");
        setTalukas([]);
      })
      .finally(() => setLoading((prev) => ({ ...prev, talukas: false })));
    form.setFieldsValue({ taluka: undefined, hobli: undefined, village: undefined });
  }, [district, form]);

  // Load hoblis when taluka changes
  useEffect(() => {
    if (!taluka) {
      setHoblis([]);
      form.setFieldsValue({ hobli: undefined, village: undefined });
      return;
    }
    setLoading((prev) => ({ ...prev, hoblis: true }));
    getHoblisByTaluka(taluka)
      .then((res) => {
        const items = normalizeList(res);
        setHoblis(items.map((r) => ({ ...r, id: r.id ?? r._id })));
      })
      .catch((err) => {
        message.error(err.message || "Failed to load hoblis");
        setHoblis([]);
      })
      .finally(() => setLoading((prev) => ({ ...prev, hoblis: false })));
    form.setFieldsValue({ hobli: undefined, village: undefined });
  }, [taluka, form]);

  // Load villages when hobli changes
  useEffect(() => {
    if (!hobli) {
      setVillages([]);
      form.setFieldsValue({ village: undefined });
      return;
    }
    setLoading((prev) => ({ ...prev, villages: true }));
    getVillages({ hobliId: hobli })
      .then((res) => {
        const items = normalizeList(res);
        setVillages(items.map((r) => ({ ...r, id: r.id ?? r._id })));
      })
      .catch((err) => {
        message.error(err.message || "Failed to load villages");
        setVillages([]);
      })
      .finally(() => setLoading((prev) => ({ ...prev, villages: false })));
    form.setFieldsValue({ village: undefined });
  }, [hobli, form]);

  return (
    <div className="w-full">
      <h2 className="mb-4 text-base font-semibold text-gray-800 sm:mb-5 sm:text-lg md:text-xl">
        Survey Info / ಸರ್ವೆ ಮಾಹಿತಿ
      </h2>
      <div className="survey-info-form space-y-0">
        <Form.Item
          name="surveyType"
          label="Survey type / ಸರ್ವೆ ಪ್ರಕಾರ"
          rules={[{ required: true, message: "Please select survey type" }]}
        >
          <Select
            placeholder="Select joint flat or single flat"
            allowClear
            size="large"
            className="w-full"
          >
            <Option value="joint_flat">Joint flat / ಜಂಟಿ ಫ್ಲಾಟ್</Option>
            <Option value="single_flat">Single flat / ಏಕ ಫ್ಲಾಟ್</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="district"
          label="District / ಜಿಲ್ಲೆ"
          rules={[{ required: true, message: "Please select district" }]}
        >
          <Select
            placeholder="Select district"
            allowClear
            size="large"
            className="w-full"
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            loading={loading.districts}
            options={districts.map((d) => ({
              value: d.id ?? d._id,
              label: d.code ? `${d.name} (${d.code})` : d.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="taluka"
          label="Taluka / ತಾಲೂಕು"
          rules={[{ required: true, message: "Please select taluka" }]}
        >
          <Select
            placeholder="Select taluka"
            allowClear
            size="large"
            className="w-full"
            disabled={!district}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            loading={loading.talukas}
            options={talukas.map((t) => ({
              value: t.id ?? t._id,
              label: t.code ? `${t.name} (${t.code})` : t.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="hobli"
          label="Hobli / ಹೋಬಳಿ"
          rules={[{ required: true, message: "Please select hobli" }]}
        >
          <Select
            placeholder="Select hobli"
            allowClear
            size="large"
            className="w-full"
            disabled={!taluka}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            loading={loading.hoblis}
            options={hoblis.map((h) => ({
              value: h.id ?? h._id,
              label: h.code ? `${h.name} (${h.code})` : h.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="village"
          label="Village / ಗ್ರಾಮ"
          rules={[{ required: true, message: "Please select village" }]}
        >
          <Select
            placeholder="Select village"
            allowClear
            size="large"
            className="w-full"
            disabled={!hobli}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            loading={loading.villages}
            options={villages.map((v) => ({
              value: v.id ?? v._id,
              label: v.code ? `${v.name} (${v.code})` : v.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="surveyNo"
          label="Survey No. / ಸರ್ವೆ ನಂ."
          rules={[{ required: true, message: "Please enter survey number" }]}
        >
          <Input
            placeholder="Enter survey number"
            size="large"
            className="w-full"
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default SurveyInfo;
