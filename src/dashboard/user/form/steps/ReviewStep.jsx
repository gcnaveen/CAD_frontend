// src/dashboard/user/form/steps/ReviewStep.jsx
import React from "react";
import { Form } from "antd";

const SectionHeader = ({ icon, titleKn, titleEn }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-9 h-9 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest leading-none mb-0.5">{titleKn}</p>
      <p className="text-lg font-extrabold text-slate-900 leading-none">{titleEn}</p>
    </div>
  </div>
);

const Row = ({ label, value }) => (
  value ? (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide shrink-0 w-28">{label}</span>
      <span className="text-sm font-bold text-slate-800 text-right">{value}</span>
    </div>
  ) : null
);

const Section = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-4">
    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{title}</p>
    </div>
    <div className="px-4">{children}</div>
  </div>
);

const ReviewStep = ({ form, uploadedDocs, audioData }) => {
  const values = form.getFieldsValue(true);

  const docFields = ["moolaTippani", "hissaTippani", "atlas", "rrPakkabook", "kharabu"];
  const uploadedDocNames = docFields
    .filter((f) => uploadedDocs?.[f]?.fileUrl)
    .map((f) => uploadedDocs[f].fileName || f);

  const otherDocsList = form.getFieldValue("other_documents");
  const otherCount    = Array.isArray(otherDocsList) ? otherDocsList.filter((f) => f.status === "done").length : 0;

  return (
    <div>
      <SectionHeader
        titleKn="ಪರಿಶೀಲನೆ"
        titleEn="Review & Submit"
        icon={
          <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* Location summary */}
      <Section title="Location">
        <Row label="Drawing Type" value={values.surveyType === "joint_flat" ? "Joint Sketch" : values.surveyType === "single_flat" ? "Single Sketch" : null} />
        <Row label="Survey No."   value={values.surveyNo} />
        <Row label="Village"      value={values.village} />
        <Row label="Hobli"        value={values.hobli} />
        <Row label="Taluka"       value={values.taluka} />
        <Row label="District"     value={values.district} />
      </Section>

      {/* Drawing summary */}
      <Section title="Drawing Details">
        <Row label="Google Map"   value={values.googleSuperimpose ? "Yes — Satellite overlay" : "No"} />
        <Row label="Notes"        value={values.others || "—"} />
        <Row label="Voice Note"   value={audioData?.fileName ? `✓ ${audioData.fileName}` : "None"} />
      </Section>

      {/* Documents summary */}
      <Section title="Documents">
        {uploadedDocNames.length > 0 ? (
          uploadedDocNames.map((name, i) => <Row key={i} label={`Doc ${i + 1}`} value={name} />)
        ) : (
          <div className="py-3">
            <p className="text-sm text-slate-400 font-semibold text-center">No documents uploaded</p>
          </div>
        )}
        {otherCount > 0 && <Row label="Other Docs" value={`${otherCount} file(s)`} />}
      </Section>

      {/* Confirmation note */}
      <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-extrabold text-orange-800">Ready to submit?</p>
          <p className="text-xs text-orange-600 font-semibold mt-0.5 leading-relaxed">
            Please review all details above. Once submitted, your CAD request will be queued for processing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;