// src/dashboard/user/form/steps/DrawingStep.jsx
import React, { useRef, useEffect, useState } from "react";
import { Form, Input, Upload, Button, message } from "antd";
import { Mic, Square, Trash2, Upload as UploadIcon } from "lucide-react";
import { uploadAudioToS3 } from "../../../../services/upload/upload.service.js";
import { deleteUploadedFile } from "../../../../services/upload/upload.api.js";
import { AUDIO_MAX_SIZE_BYTES } from "../../../../services/upload/upload.constants.js";

const { TextArea } = Input;
const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.aac,.ogg";

const SectionHeader = ({ icon, titleKn, titleEn }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-9 h-9 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest leading-none mb-0.5">{titleKn}</p>
      <p className="text-lg font-extrabold text-slate-900 leading-none">{titleEn}</p>
    </div>
  </div>
);

const FieldLabel = ({ kn, en, required, optional }) => (
  <span className="flex flex-col leading-none mb-1">
    <span className="text-[10px] font-semibold text-slate-400">{kn}</span>
    <span className="text-sm font-bold text-slate-700">
      {en}
      {required && <span className="text-orange-500 ml-0.5">*</span>}
      {optional && <span className="text-slate-400 font-semibold ml-1 text-xs">(optional)</span>}
    </span>
  </span>
);

const DrawingStep = ({ form, onAudioChange, audioData }) => {
  const village = Form.useWatch("village", form);
  const audioField = Form.useWatch("audio", form);

  const [isRecording, setIsRecording]   = useState(false);
  const [recordingTime, setRecTime]     = useState(0);
  const [audioBlob, setAudioBlob]       = useState(null);
  const [audioUrl, setAudioUrl]         = useState(null);
  const [uploadingAudio, setUpAudio]    = useState(false);
  const [mediaRecorder, setMediaRec]    = useState(null);
  const timerRef  = useRef(null);
  const streamRef = useRef(null);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = async () => {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime     = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mime || undefined });
      const chunks   = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mime || "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      };
      recorder.start();
      setMediaRec(recorder);
      setIsRecording(true);
      setRecTime(0);
      timerRef.current = setInterval(() => setRecTime((p) => p + 1), 1000);
    } catch { message.error("Failed to access microphone. Check permissions."); }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
  };

  const handleUploadRecorded = async () => {
    if (!audioBlob) return;
    if (!village) { message.warning("Please select village first"); return; }
    setUpAudio(true);
    try {
      const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: audioBlob.type });
      const { fileUrl, key } = await uploadAudioToS3(file, village);
      const val = { fileUrl, key, fileName: file.name, mimeType: file.type, size: file.size };
      form.setFieldsValue({ audio: val });
      onAudioChange?.(val);
      message.success("Audio uploaded");
      setAudioBlob(null);
      if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    } catch (e) { message.error(e.message || "Failed to upload audio"); }
    finally { setUpAudio(false); }
  };

  const handleAudioFile = async (file) => {
    if (!village) { message.warning("Please select village first"); return false; }
    if (file.size > AUDIO_MAX_SIZE_BYTES) { message.error(`Max ${AUDIO_MAX_SIZE_BYTES / 1024 / 1024}MB`); return false; }
    setUpAudio(true);
    try {
      const actual = file instanceof File ? file : (file.originFileObj instanceof File ? file.originFileObj : file);
      const { fileUrl, key } = await uploadAudioToS3(actual, village);
      const val = { fileUrl, key, fileName: actual.name, mimeType: actual.type, size: actual.size };
      form.setFieldsValue({ audio: val });
      onAudioChange?.(val);
      message.success("Audio uploaded");
    } catch (e) { message.error(e.message || "Failed to upload audio"); }
    finally { setUpAudio(false); return false; }
  };

  const handleDeleteAudio = async () => {
    const d = form.getFieldValue("audio");
    if (d?.fileUrl || d?.key) {
      try { await deleteUploadedFile(d.fileUrl ? { fileUrl: d.fileUrl } : { key: d.key }); }
      catch { /* silent */ }
    }
    setAudioBlob(null);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    setRecTime(0);
    form.setFieldsValue({ audio: null });
    onAudioChange?.(null);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const googleSuperimpose = Form.useWatch("googleSuperimpose", form);

  return (
    <div>
      <SectionHeader
        titleKn="ನಕ್ಷೆ ವಿವರ"
        titleEn="Drawing Details"
        icon={
          <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        }
      />

      <div className="space-y-5">
        {/* Upload Mode - kept as radio but styled as cards */}
        <Form.Item name="uploadMode" initialValue="normal" noStyle>
          <input type="hidden" />
        </Form.Item>

        {/* Google Superimpose checkbox */}
        <Form.Item name="googleSuperimpose" valuePropName="checked">
          <button
            type="button"
            onClick={() => form.setFieldValue("googleSuperimpose", !googleSuperimpose)}
            className={`w-full flex items-start gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
              googleSuperimpose ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-200"
            }`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              googleSuperimpose ? "border-orange-500 bg-orange-500" : "border-slate-300 bg-white"
            }`}>
              {googleSuperimpose && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900">Google Superimpose</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">ಗೂಗಲ್ ಉಪಗ್ರಹ ಮೇಲ್ದರ / Satellite overlay on drawing</p>
            </div>
          </button>
        </Form.Item>

        {/* Notes */}
        <Form.Item
          name="others"
          label={<FieldLabel kn="ಟಿಪ್ಪಣಿಗಳು" en="Notes" optional />}
        >
          <TextArea
            rows={3}
            placeholder="Type your instructions or record a voice note"
            size="large"
            className="w-full resize-none rounded-xl"
          />
        </Form.Item>

        {/* Audio (Ant Form needs the field registered; hide the actual DOM) */}
        <Form.Item name="audio" noStyle>
          <div className="hidden" />
        </Form.Item>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">ಆಡಿಯೋ</p>
          <p className="text-sm font-extrabold text-slate-900 mb-3">Voice Note <span className="text-slate-400 font-semibold text-xs">(optional)</span></p>

          {/* Idle state */}
          {!isRecording && !audioBlob && !audioField && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm transition-colors"
              >
                <Mic className="w-4 h-4" /> Record Audio
              </button>
              <Upload accept={AUDIO_ACCEPT} showUploadList={false} beforeUpload={handleAudioFile}>
                <button
                  type="button"
                  disabled={uploadingAudio}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:border-orange-200 text-slate-700 font-extrabold text-sm transition-colors"
                >
                  <UploadIcon className="w-4 h-4" />
                  {uploadingAudio ? "Uploading…" : "Upload File"}
                </button>
              </Upload>
            </div>
          )}

          {/* Recording */}
          {isRecording && (
            <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-100 p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                </div>
                <div>
                  <p className="font-extrabold text-red-700 text-sm">Recording…</p>
                  <p className="text-xs text-red-500 font-bold">{fmt(recordingTime)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white font-extrabold text-sm"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            </div>
          )}

          {/* Preview */}
          {audioBlob && audioUrl && !audioField && (
            <div className="space-y-3">
              <audio controls src={audioUrl} className="w-full rounded-xl" />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUploadRecorded}
                  disabled={uploadingAudio}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm disabled:opacity-60 transition-colors"
                >
                  <UploadIcon className="w-4 h-4" />
                  {uploadingAudio ? "Uploading…" : "Save Recording"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAudio}
                  disabled={uploadingAudio}
                  className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 font-extrabold text-sm hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Uploaded */}
          {audioField && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-extrabold text-emerald-700 text-sm">✓ Audio saved</p>
                  <p className="text-xs text-emerald-600 font-semibold truncate">{audioField.fileName}</p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAudio}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-500 font-bold text-xs hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
              {audioField.fileUrl && <audio controls src={audioField.fileUrl} className="w-full rounded-lg" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawingStep;