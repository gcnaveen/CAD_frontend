// src/dashboard/user/form/steps/LocationStep.jsx
import React, { useEffect, useState } from "react";
import { Form, Select, Input, message } from "antd";
import { getDistricts }        from "../../../../services/masters/districtService.js";
import { getTalukasByDistrict } from "../../../../services/masters/talukaService.js";
import { getHoblisByTaluka }   from "../../../../services/masters/hobliService.js";
import { getVillages }         from "../../../../services/masters/villageService.js";

/* ── helpers (same logic as original SurveyInfo) ── */
function normalizeList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}
function idOf(e)      { return e?.id ?? e?._id ?? null; }
function idFromValue(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  return v.id ?? v._id ?? null;
}
function upsertEntity(list, entity) {
  const id = idOf(entity);
  if (!id) return list;
  const exists = Array.isArray(list) && list.some((x) => (x.id ?? x._id) === id);
  if (exists) return list;
  return Array.isArray(list) ? [{ ...entity, id }, ...list] : [{ ...entity, id }];
}

/* ── Section header ── */
const SectionHeader = ({ icon, titleKn, titleEn }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-9 h-9 rounded-2xl bg-[var(--user-accent-soft)] border border-[color-mix(in_srgb,var(--user-accent)_22%,var(--border-color))] flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-bold text-[var(--user-accent)] uppercase tracking-widest leading-none mb-0.5">{titleKn}</p>
      <p className="text-lg font-extrabold text-fg leading-none">{titleEn}</p>
    </div>
  </div>
);

/* ── Styled label ── */
const FieldLabel = ({ kn, en, required }) => (
  <span className="flex flex-col leading-none mb-1">
    <span className="text-[10px] font-semibold text-fg-muted">{kn}</span>
    <span className="text-sm font-bold text-fg">{en} {required && <span className="text-[var(--user-accent)]">*</span>}</span>
  </span>
);

function labelOfEntity(entity) {
  return entity?.name ?? entity?.label ?? null;
}

const LocationStep = ({ form, prefillEntities = null, onLocationLabelsChange }) => {
  const [districts, setDistricts] = useState([]);
  const [talukas,   setTalukas]   = useState([]);
  const [hoblis,    setHoblis]     = useState([]);
  const [villages,  setVillages]   = useState([]);
  const [loading,   setLoading]    = useState({ districts: false, talukas: false, hoblis: false, villages: false });

  const surveyType = Form.useWatch("surveyType", form);
  const district = Form.useWatch("district", form);
  const taluka   = Form.useWatch("taluka",   form);
  const hobli    = Form.useWatch("hobli",    form);
  const village  = Form.useWatch("village",  form);

  const prefillDistrictId = idFromValue(prefillEntities?.district) || idOf(prefillEntities?.district);
  const prefillTalukaId   = idFromValue(prefillEntities?.taluka)   || idOf(prefillEntities?.taluka);
  const prefillHobliId    = idFromValue(prefillEntities?.hobli)    || idOf(prefillEntities?.hobli);

  /* Districts */
  useEffect(() => {
    setLoading((p) => ({ ...p, districts: true }));
    getDistricts()
      .then((res) => setDistricts(normalizeList(res).map((r) => ({ ...r, id: r.id ?? r._id }))))
      .catch((err) => { message.error(err.message || "Failed to load districts"); setDistricts([]); })
      .finally(() => setLoading((p) => ({ ...p, districts: false })));
  }, []);

  /* Talukas */
  useEffect(() => {
    if (!district) {
      setTalukas((p) => upsertEntity(p, prefillEntities?.taluka));
      const hasDown = !!form.getFieldValue("taluka") || !!form.getFieldValue("hobli") || !!form.getFieldValue("village");
      if (!hasDown) form.setFieldsValue({ taluka: undefined, hobli: undefined, village: undefined });
      return;
    }
    setLoading((p) => ({ ...p, talukas: true }));
    getTalukasByDistrict(district)
      .then((res) => setTalukas(upsertEntity(normalizeList(res).map((r) => ({ ...r, id: r.id ?? r._id })), prefillEntities?.taluka)))
      .catch((err) => { message.error(err.message || "Failed to load talukas"); setTalukas([]); })
      .finally(() => setLoading((p) => ({ ...p, talukas: false })));
    const curDistId  = idFromValue(district);
    const curTalukId = idFromValue(form.getFieldValue("taluka"));
    const isDraft    = !!prefillEntities && curDistId === prefillDistrictId && curTalukId === prefillTalukaId;
    if (!isDraft) form.setFieldsValue({ taluka: undefined, hobli: undefined, village: undefined });
  }, [district]);

  /* Hoblis */
  useEffect(() => {
    if (!taluka) {
      setHoblis((p) => upsertEntity(p, prefillEntities?.hobli));
      const hasDown = !!form.getFieldValue("hobli") || !!form.getFieldValue("village");
      if (!hasDown) form.setFieldsValue({ hobli: undefined, village: undefined });
      return;
    }
    setLoading((p) => ({ ...p, hoblis: true }));
    getHoblisByTaluka(taluka)
      .then((res) => setHoblis(upsertEntity(normalizeList(res).map((r) => ({ ...r, id: r.id ?? r._id })), prefillEntities?.hobli)))
      .catch((err) => { message.error(err.message || "Failed to load hoblis"); setHoblis([]); })
      .finally(() => setLoading((p) => ({ ...p, hoblis: false })));
    const curTalukId = idFromValue(taluka);
    const curHobliId = idFromValue(form.getFieldValue("hobli"));
    const isDraft    = !!prefillEntities && curTalukId === prefillTalukaId && curHobliId === prefillHobliId;
    if (!isDraft) form.setFieldsValue({ hobli: undefined, village: undefined });
  }, [taluka]);

  /* Villages */
  useEffect(() => {
    if (!hobli) {
      setVillages((p) => upsertEntity(p, prefillEntities?.village));
      if (!form.getFieldValue("village")) form.setFieldsValue({ village: undefined });
      return;
    }
    setLoading((p) => ({ ...p, villages: true }));
    getVillages({ hobliId: hobli })
      .then((res) => setVillages(upsertEntity(normalizeList(res).map((r) => ({ ...r, id: r.id ?? r._id })), prefillEntities?.village)))
      .catch((err) => { message.error(err.message || "Failed to load villages"); setVillages([]); })
      .finally(() => setLoading((p) => ({ ...p, villages: false })));
    const curHobliId   = idFromValue(hobli);
    const curVillageId = idFromValue(form.getFieldValue("village"));
    const prefVillId   = idFromValue(prefillEntities?.village) || idOf(prefillEntities?.village);
    const isDraft      = !!prefillEntities && curHobliId === prefillHobliId && curVillageId === prefVillId;
    if (!isDraft) form.setFieldsValue({ village: undefined });
  }, [hobli]);

  /* Sync prefill entities into dropdowns */
  useEffect(() => {
    if (!prefillEntities) return;
    if (taluka)  setTalukas((p)  => upsertEntity(p, prefillEntities.taluka));
    if (hobli)   setHoblis((p)   => upsertEntity(p, prefillEntities.hobli));
    if (village) setVillages((p) => upsertEntity(p, prefillEntities.village));
  }, [prefillEntities, taluka, hobli, village]);

  /* Ensure label fields exist in the form even for draft prefill */
  useEffect(() => {
    if (!prefillEntities) return;
    form.setFieldsValue({
      districtLabel: labelOfEntity(prefillEntities.district),
      talukaLabel: labelOfEntity(prefillEntities.taluka),
      hobliLabel: labelOfEntity(prefillEntities.hobli),
      villageLabel: labelOfEntity(prefillEntities.village),
    });
  }, [prefillEntities, form]);

  const selectCls = "w-full";
  const sharedSelectProps = {
    size: "large",
    allowClear: true,
    showSearch: true,
    optionFilterProp: "label",
    filterOption: (input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase()),
    className: selectCls,
  };

  const setLocationLabels = (next) => {
    form.setFieldsValue({
      districtLabel: next.district ?? null,
      talukaLabel: next.taluka ?? null,
      hobliLabel: next.hobli ?? null,
      villageLabel: next.village ?? null,
    });
    onLocationLabelsChange?.(next);
  };

  return (
    <div>
      <SectionHeader
        titleKn="ಸ್ಥಳ ಮಾಹಿತಿ"
        titleEn="Location"
        icon={
          <svg className="w-5 h-5 text-[var(--user-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />

      <div className="space-y-4">
        {/* Survey Type */}
        <Form.Item
          name="surveyType"
          label={<FieldLabel kn="ನಕ್ಷೆ ಪ್ರಕಾರ" en="Drawing Type" required />}
          rules={[{ required: true, message: "Please select drawing type" }]}
        >
          <div className="space-y-2">
            {[
              { value: "single_flat", en: "Single Sketch", kn: "ಏಕ ನಕ್ಷೆ" },
              { value: "joint_flat",  en: "Joint Sketch",  kn: "ಜಂಟಿ ನಕ್ಷೆ" },
            ].map((opt) => {
              const active = surveyType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => form.setFieldValue("surveyType", opt.value)}
                  className={`w-full flex items-center justify-between rounded-2xl p-4 border transition-all cursor-pointer
                    bg-[var(--bg-secondary)]
                    text-[var(--text-primary)]
                    border-[var(--border-color)]
                    ${
                      active
                        ? "border-2 border-[var(--accent-color)] bg-[color-mix(in_srgb,var(--accent-color)_15%,var(--bg-secondary))] shadow-[0_2px_12px_color-mix(in_srgb,var(--accent-color)_20%,transparent)] hover:border-[var(--accent-color)]"
                        : "hover:border-[color-mix(in_srgb,var(--accent-color)_40%,var(--border-color))]"
                    }
                  `}
                >
                  <div>
                    <p className="font-extrabold text-sm text-[var(--text-primary)]">{opt.en}</p>
                    <p className="text-xs font-semibold mt-0.5 text-[var(--text-secondary)]">{opt.kn}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                      ${active ? "border-[var(--accent-color)]" : "border-[var(--border-color)]"}
                    `}
                    aria-hidden
                  >
                  {active ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-color)] shadow-[0_1px_4px_color-mix(in_srgb,var(--accent-color)_25%,transparent)]" />
                  ) : null}
                </div>
                </button>
              );
            })}
          </div>
        </Form.Item>

        {/* District */}
        <Form.Item
          name="district"
          label={<FieldLabel kn="ಜಿಲ್ಲೆ" en="District" required />}
          rules={[{ required: true, message: "Please select district" }]}
        >
          <Select
            {...sharedSelectProps}
            placeholder="Select district"
            loading={loading.districts}
            options={districts.map((d) => ({ value: d.id ?? d._id, label: d.code ? `${d.name} (${d.code})` : d.name }))}
            onChange={(_, option) => {
              const selectedLabel = option?.label ?? null;
              form.setFieldsValue({ taluka: undefined, hobli: undefined, village: undefined });
              setLocationLabels({ district: selectedLabel, taluka: null, hobli: null, village: null });
            }}
          />
        </Form.Item>

        {/* Taluka */}
        <Form.Item
          name="taluka"
          label={<FieldLabel kn="ತಾಲೂಕು" en="Taluk" required />}
          rules={[{ required: true, message: "Please select taluka" }]}
        >
          <Select
            {...sharedSelectProps}
            placeholder={!district && !taluka ? "Select district first" : "Select taluk"}
            disabled={!district && !taluka}
            loading={loading.talukas}
            options={talukas.map((t) => ({ value: t.id ?? t._id, label: t.code ? `${t.name} (${t.code})` : t.name }))}
            onChange={(_, option) => {
              const selectedLabel = option?.label ?? null;
              form.setFieldsValue({ hobli: undefined, village: undefined });
              setLocationLabels({
                district: form.getFieldValue("districtLabel"),
                taluka: selectedLabel,
                hobli: null,
                village: null,
              });
            }}
          />
        </Form.Item>

        {/* Hobli */}
        <Form.Item
          name="hobli"
          label={<FieldLabel kn="ಹೋಬಳಿ" en="Hobli" />}
          rules={[{ required: true, message: "Please select hobli" }]}
        >
          <Select
            {...sharedSelectProps}
            placeholder={!taluka && !hobli ? "Select taluk first" : "Select hobli"}
            disabled={!taluka && !hobli}
            loading={loading.hoblis}
            options={hoblis.map((h) => ({ value: h.id ?? h._id, label: h.code ? `${h.name} (${h.code})` : h.name }))}
            onChange={(_, option) => {
              const selectedLabel = option?.label ?? null;
              form.setFieldsValue({ village: undefined });
              setLocationLabels({
                district: form.getFieldValue("districtLabel"),
                taluka: form.getFieldValue("talukaLabel"),
                hobli: selectedLabel,
                village: null,
              });
            }}
          />
        </Form.Item>

        {/* Village */}
        <Form.Item
          name="village"
          label={<FieldLabel kn="ಗ್ರಾಮ" en="Village" />}
          rules={[{ required: false, message: "Please select village" }]}
        >
          <Select
            {...sharedSelectProps}
            placeholder={!hobli && !village ? "Select hobli first" : "Select village"}
            disabled={!hobli && !village}
            loading={loading.villages}
            options={villages.map((v) => ({ value: v.id ?? v._id, label: v.code ? `${v.name} (${v.code})` : v.name }))}
            onChange={(_, option) => {
              const selectedLabel = option?.label ?? null;
              setLocationLabels({
                district: form.getFieldValue("districtLabel"),
                taluka: form.getFieldValue("talukaLabel"),
                hobli: form.getFieldValue("hobliLabel"),
                village: selectedLabel,
              });
            }}
          />
        </Form.Item>

        {/* Survey No */}
        <Form.Item
          name="surveyNo"
          label={<FieldLabel kn="ಸರ್ವೆ ನಂ." en="Survey Number" required />}
          rules={[{ required: true, message: "Please enter survey number" }]}
        >
          <Input
            placeholder="e.g. 42/3"
            size="large"
            className="w-full rounded-xl"
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default LocationStep;