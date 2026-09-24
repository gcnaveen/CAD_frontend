// src/dashboard/user/form/steps/LocationStep.jsx
import React, { useEffect, useRef, useState } from "react";
import { Form, Select, Input, message, Modal } from "antd";
import { getActiveDistricts } from "../../../../services/masters/districtService.js";
import { getTalukasByDistrict } from "../../../../services/masters/talukaService.js";
import { getHoblisByTaluka }   from "../../../../services/masters/hobliService.js";
import { getVillages }         from "../../../../services/masters/villageService.js";
import {
  normalizeCascadeParentId,
  shouldClearCascadeChildren,
} from "../../../../utils/locationCascade.js";

const SKETCH_TYPE_GUIDE = [
  {
    value: "single_flat",
    en: "Single Sketch",
    kn: "ಏಕ ನಕ್ಷೆ",
    descriptionEn: "One survey number converted into a single CAD drawing.",
    descriptionKn: "ಒಂದು ಸರ್ವೆ ನಂಬರ್‌ಗೆ ಒಂದು CAD ನಕ್ಷೆ.",
    imageSrc: "/assets/beforeafter/residential-after-B4Pd_a8V-320w.webp",
    imageAlt: "Example single sketch drawing",
    priceLabel: "₹500",
  },
  {
    value: "joint_flat",
    en: "Joint Sketch",
    kn: "ಜಂಟಿ ನಕ್ಷೆ",
    descriptionEn: "Two or more survey numbers combined into one CAD drawing.",
    descriptionKn: "ಎರಡು ಅಥವಾ ಹೆಚ್ಚು ಸರ್ವೆ ನಂಬರ್‌ಗಳನ್ನು ಒಂದೇ ನಕ್ಷೆಯಲ್ಲಿ ಸೇರಿಸಲಾಗುತ್ತದೆ.",
    imageSrc: "/assets/beforeafter/partition-after-C94SAZFl-320w.webp",
    imageAlt: "Example joint sketch drawing",
    priceLabel: "₹700",
  },
];

/* ── helpers (same logic as original SurveyInfo) ── */
function normalizeList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}
function idOf(e)      { return e?.id ?? e?._id ?? null; }
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
    <div className="w-9 h-9 rounded-2xl bg-(--user-accent-soft) border border-[color-mix(in_srgb,var(--user-accent)_22%,var(--border-color))] flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-bold text-(--user-accent) uppercase tracking-widest leading-none mb-0.5">{titleKn}</p>
      <p className="text-lg font-extrabold text-fg leading-none">{titleEn}</p>
    </div>
  </div>
);

/* ── Styled label ── */
const FieldLabel = ({ kn, en, required }) => (
  <span className="flex flex-col leading-none mb-1">
    <span className="text-[10px] font-semibold text-fg-muted">{kn}</span>
    <span className="text-sm font-bold text-fg">{en} {required && <span className="text-(--user-accent)">*</span>}</span>
  </span>
);

function DrawingTypeInfoButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Drawing type information"
      className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--user-accent)_28%,var(--border-color))] bg-(--user-accent-soft) text-(--user-accent) cursor-pointer"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 11.2V16.5" />
        <circle cx="12" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}

function DrawingTypeInfoModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={440}
      title="Drawing type guide"
      destroyOnHidden
    >
      <p className="text-xs text-fg-muted mb-4 leading-relaxed">
        Example drawings and indicative prices. Your exact amount is confirmed on Review.
      </p>
      <div className="space-y-4">
        {SKETCH_TYPE_GUIDE.map((item) => (
          <article
            key={item.value}
            className="overflow-hidden rounded-2xl border border-line bg-surface"
          >
            <img
              src={item.imageSrc}
              alt={item.imageAlt}
              className="h-36 w-full object-cover bg-surface-2"
            />
            <div className="p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-fg-muted leading-none mb-1">{item.kn}</p>
                  <p className="text-sm font-extrabold text-fg leading-none">{item.en}</p>
                </div>
                <span className="shrink-0 rounded-full bg-(--user-accent-soft) px-2.5 py-1 text-sm font-extrabold text-(--user-accent)">
                  {item.priceLabel}
                </span>
              </div>
              <p className="mt-2.5 text-sm font-medium text-fg leading-snug">{item.descriptionEn}</p>
              <p className="mt-1 text-xs text-fg-muted leading-snug">{item.descriptionKn}</p>
            </div>
          </article>
        ))}
      </div>
    </Modal>
  );
}

function labelOfEntity(entity) {
  return entity?.name ?? entity?.label ?? null;
}

/** Keep Select options able to show the current form value before/while lists load. */
function stubFromForm(idValue, label) {
  const id = normalizeCascadeParentId(idValue);
  if (!id) return null;
  return { id, name: label || id };
}

const LocationStep = ({ form, prefillEntities = null, onLocationLabelsChange }) => {
  const [districts, setDistricts] = useState([]);
  const [talukas,   setTalukas]   = useState([]);
  const [hoblis,    setHoblis]     = useState([]);
  const [villages,  setVillages]   = useState([]);
  const [loading,   setLoading]    = useState({ districts: false, talukas: false, hoblis: false, villages: false });
  const [guideOpen, setGuideOpen]  = useState(false);

  const surveyType = Form.useWatch("surveyType", form);
  const district = Form.useWatch("district", form);
  const taluka   = Form.useWatch("taluka",   form);
  const hobli    = Form.useWatch("hobli",    form);
  const village  = Form.useWatch("village",  form);

  const prevDistrictIdRef = useRef(undefined);
  const prevTalukaIdRef = useRef(undefined);
  const prevHobliIdRef = useRef(undefined);

  /* Districts */
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading((p) => ({ ...p, districts: true }));
    });
    getActiveDistricts()
      .then((res) => setDistricts(normalizeList(res).map((r) => ({ ...r, id: r.id ?? r._id }))))
      .catch((err) => { message.error(err.message || "Failed to load districts"); setDistricts([]); })
      .finally(() => setLoading((p) => ({ ...p, districts: false })));
    return () => {
      cancelled = true;
    };
  }, []);

  /* Talukas — clear children only when district *changes*, not on remount */
  useEffect(() => {
    const curDistId = normalizeCascadeParentId(district);
    const prevDistId = prevDistrictIdRef.current;
    const keepPrefill =
      !!prefillEntities &&
      curDistId != null &&
      curDistId === normalizeCascadeParentId(prefillEntities.district);
    const clearChildren = shouldClearCascadeChildren({
      prevParentId: prevDistId,
      nextParentId: curDistId,
      hasExistingChildren: Boolean(
        form.getFieldValue("taluka") ||
          form.getFieldValue("hobli") ||
          form.getFieldValue("village")
      ),
      keepPrefill,
    });
    prevDistrictIdRef.current = curDistId;

    const talukaStub =
      stubFromForm(form.getFieldValue("taluka"), form.getFieldValue("talukaLabel")) ||
      prefillEntities?.taluka;

    if (!district) {
      queueMicrotask(() => {
        setTalukas((p) => upsertEntity(p, talukaStub));
      });
      if (clearChildren) {
        form.setFieldsValue({ taluka: undefined, hobli: undefined, village: undefined });
      }
      return;
    }

    if (clearChildren) {
      form.setFieldsValue({ taluka: undefined, hobli: undefined, village: undefined });
    }

    let cancelled = false;
    queueMicrotask(() => setLoading((p) => ({ ...p, talukas: true })));
    getTalukasByDistrict(district)
      .then((res) => {
        if (cancelled) return;
        setTalukas(
          upsertEntity(
            normalizeList(res).map((r) => ({ ...r, id: r.id ?? r._id })),
            talukaStub
          )
        );
      })
      .catch((err) => {
        if (cancelled) return;
        message.error(err.message || "Failed to load talukas");
        setTalukas([]);
      })
      .finally(() => {
        if (!cancelled) setLoading((p) => ({ ...p, talukas: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [district, form, prefillEntities]);

  /* Hoblis */
  useEffect(() => {
    const curTalukId = normalizeCascadeParentId(taluka);
    const prevTalukId = prevTalukaIdRef.current;
    const keepPrefill =
      !!prefillEntities &&
      curTalukId != null &&
      curTalukId === normalizeCascadeParentId(prefillEntities.taluka);
    const clearChildren = shouldClearCascadeChildren({
      prevParentId: prevTalukId,
      nextParentId: curTalukId,
      hasExistingChildren: Boolean(
        form.getFieldValue("hobli") || form.getFieldValue("village")
      ),
      keepPrefill,
    });
    prevTalukaIdRef.current = curTalukId;

    const hobliStub =
      stubFromForm(form.getFieldValue("hobli"), form.getFieldValue("hobliLabel")) ||
      prefillEntities?.hobli;

    if (!taluka) {
      queueMicrotask(() => {
        setHoblis((p) => upsertEntity(p, hobliStub));
      });
      if (clearChildren) {
        form.setFieldsValue({ hobli: undefined, village: undefined });
      }
      return;
    }

    if (clearChildren) {
      form.setFieldsValue({ hobli: undefined, village: undefined });
    }

    let cancelled = false;
    queueMicrotask(() => setLoading((p) => ({ ...p, hoblis: true })));
    getHoblisByTaluka(taluka)
      .then((res) => {
        if (cancelled) return;
        setHoblis(
          upsertEntity(
            normalizeList(res).map((r) => ({ ...r, id: r.id ?? r._id })),
            hobliStub
          )
        );
      })
      .catch((err) => {
        if (cancelled) return;
        message.error(err.message || "Failed to load hoblis");
        setHoblis([]);
      })
      .finally(() => {
        if (!cancelled) setLoading((p) => ({ ...p, hoblis: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [taluka, form, prefillEntities]);

  /* Villages */
  useEffect(() => {
    const curHobliId = normalizeCascadeParentId(hobli);
    const prevHobliId = prevHobliIdRef.current;
    const keepPrefill =
      !!prefillEntities &&
      curHobliId != null &&
      curHobliId === normalizeCascadeParentId(prefillEntities.hobli);
    const clearChildren = shouldClearCascadeChildren({
      prevParentId: prevHobliId,
      nextParentId: curHobliId,
      hasExistingChildren: Boolean(form.getFieldValue("village")),
      keepPrefill,
    });
    prevHobliIdRef.current = curHobliId;

    const villageStub =
      stubFromForm(form.getFieldValue("village"), form.getFieldValue("villageLabel")) ||
      prefillEntities?.village;

    if (!hobli) {
      queueMicrotask(() => {
        setVillages((p) => upsertEntity(p, villageStub));
      });
      if (clearChildren) {
        form.setFieldsValue({ village: undefined });
      }
      return;
    }

    if (clearChildren) {
      form.setFieldsValue({ village: undefined });
    }

    let cancelled = false;
    queueMicrotask(() => setLoading((p) => ({ ...p, villages: true })));
    getVillages({ hobliId: hobli })
      .then((res) => {
        if (cancelled) return;
        setVillages(
          upsertEntity(
            normalizeList(res).map((r) => ({ ...r, id: r.id ?? r._id })),
            villageStub
          )
        );
      })
      .catch((err) => {
        if (cancelled) return;
        message.error(err.message || "Failed to load villages");
        setVillages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading((p) => ({ ...p, villages: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [hobli, form, prefillEntities]);

  /* Sync prefill entities into dropdowns */
  useEffect(() => {
    if (!prefillEntities) return;
    queueMicrotask(() => {
      if (taluka)  setTalukas((p)  => upsertEntity(p, prefillEntities.taluka));
      if (hobli)   setHoblis((p)   => upsertEntity(p, prefillEntities.hobli));
      if (village) setVillages((p) => upsertEntity(p, prefillEntities.village));
    });
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
          <svg className="w-5 h-5 text-(--user-accent)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />

      <div className="space-y-4">
        {/* Survey Type */}
        <Form.Item
          name="surveyType"
          label={
            <span className="flex items-start justify-between gap-2">
              <FieldLabel kn="ನಕ್ಷೆ ಪ್ರಕಾರ" en="Drawing Type" required />
              <DrawingTypeInfoButton onClick={() => setGuideOpen(true)} />
            </span>
          }
          rules={[{ required: true, message: "Please select drawing type" }]}
        >
          <div className="space-y-2">
            {SKETCH_TYPE_GUIDE.map((opt) => {
              const active = surveyType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => form.setFieldValue("surveyType", opt.value)}
                  className={`w-full flex items-center justify-between rounded-2xl p-4 border transition-all cursor-pointer
                    bg-(--bg-secondary)
                    text-(--text-primary)
                    border-(--border-color)
                    ${
                      active
                        ? "border-2 border-(--accent-color) bg-[color-mix(in_srgb,var(--accent-color)_15%,var(--bg-secondary))] shadow-[0_2px_12px_color-mix(in_srgb,var(--accent-color)_20%,transparent)] hover:border-(--accent-color)"
                        : "hover:border-[color-mix(in_srgb,var(--accent-color)_40%,var(--border-color))]"
                    }
                  `}
                >
                  <div>
                    <p className="font-extrabold text-sm text-(--text-primary)">{opt.en}</p>
                    <p className="text-xs font-semibold mt-0.5 text-(--text-secondary)">{opt.kn}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                        ${active ? "border-(--accent-color)" : "border-(--border-color)"}
                      `}
                      aria-hidden
                    >
                      {active ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-(--accent-color) shadow-[0_1px_4px_color-mix(in_srgb,var(--accent-color)_25%,transparent)]" />
                      ) : null}
                    </div>
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
            options={districts.map((d) => ({ value: d.id ?? d._id, label: d.name }))}
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
          label={<FieldLabel kn="ತಾಲೂಕು" en="Taluka" required />}
          rules={[{ required: true, message: "Please select taluka" }]}
        >
          <Select
            {...sharedSelectProps}
            placeholder={!district && !taluka ? "Select district first" : "Select taluka"}
            disabled={!district && !taluka}
            loading={loading.talukas}
            options={talukas.map((t) => ({ value: t.id ?? t._id, label: t.name }))}
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
          rules={[{ required: false }]}
        >
          <Select
            {...sharedSelectProps}
            placeholder={!taluka && !hobli ? "Select taluk first" : "Select hobli"}
            disabled={!taluka && !hobli}
            loading={loading.hoblis}
            options={hoblis.map((h) => ({ value: h.id ?? h._id, label: h.name }))}
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
            options={villages.map((v) => ({ value: v.id ?? v._id, label: v.name }))}
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

      <DrawingTypeInfoModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
};

export default LocationStep;