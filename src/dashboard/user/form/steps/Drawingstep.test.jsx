import React, { useEffect } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Form } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DrawingStep from "./Drawingstep.jsx";

const uploadAudioToS3 = vi.fn();
const toVoiceNoteFile = vi.fn();
const deleteUploadedFile = vi.fn();

vi.mock("../../../../services/upload/upload.api.js", () => ({
  deleteUploadedFile: (...args) => deleteUploadedFile(...args),
}));

vi.mock("../../../../services/upload/upload.service.js", () => ({
  uploadAudioToS3: (...args) => uploadAudioToS3(...args),
  toVoiceNoteFile: (...args) => toVoiceNoteFile(...args),
  pickVoiceRecorderMimeType: () => "audio/webm",
  buildVoiceNoteBlob: (chunks) =>
    new Blob(chunks.length ? chunks : [new Uint8Array([1, 2, 3])], { type: "audio/webm" }),
}));

vi.mock("../../../../services/upload/upload.errors.js", () => ({
  getUploadErrorMessage: (e) => e?.message || "Failed to upload audio",
}));

class FakeMediaRecorder {
  constructor() {
    this.state = "inactive";
    this.mimeType = "audio/webm";
    this.ondataavailable = null;
    this.onstop = null;
  }
  start() {
    this.state = "recording";
  }
  requestData() {
    this.ondataavailable?.({
      data: new Blob([new Uint8Array([1, 2, 3, 4])], { type: "audio/webm" }),
    });
  }
  stop() {
    this.state = "inactive";
    this.requestData();
    this.onstop?.();
  }
}
FakeMediaRecorder.isTypeSupported = () => true;

function buttonByText(text) {
  return Array.from(document.querySelectorAll("button")).find(
    (el) => el.textContent?.replace(/\s+/g, " ").trim() === text
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

function Harness({ stepRef, onForm, onAudioChange, audioData }) {
  const [form] = Form.useForm();
  useEffect(() => {
    onForm(form);
  }, [form, onForm]);
  return (
    <Form form={form} initialValues={{ village: "vil-1", googleSuperimpose: false }}>
      <DrawingStep
        ref={stepRef}
        form={form}
        audioData={audioData || null}
        onAudioChange={onAudioChange}
      />
    </Form>
  );
}

describe("DrawingStep flushPendingAudio", () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    uploadAudioToS3.mockReset();
    toVoiceNoteFile.mockReset();
    deleteUploadedFile.mockReset();
    uploadAudioToS3.mockResolvedValue({
      fileUrl: "https://cdn.example/voice.webm",
      key: "uploads/voice.webm",
    });
    toVoiceNoteFile.mockImplementation(async (blob) => new File([blob], "voice.webm", { type: "audio/webm" }));
    deleteUploadedFile.mockResolvedValue({});

    container = document.createElement("div");
    document.body.appendChild(container);
    window.MediaRecorder = FakeMediaRecorder;
    navigator.mediaDevices = {
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: vi.fn() }],
      })),
    };
    if (typeof URL.createObjectURL !== "function") {
      URL.createObjectURL = () => "blob:drawing-test";
    }
    if (typeof URL.revokeObjectURL !== "function") {
      URL.revokeObjectURL = () => {};
    }
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverStub;
    window.ResizeObserver = window.ResizeObserver || ResizeObserverStub;
    window.matchMedia =
      window.matchMedia ||
      function matchMedia() {
        return {
          matches: false,
          media: "",
          onchange: null,
          addListener() {},
          removeListener() {},
          addEventListener() {},
          removeEventListener() {},
          dispatchEvent() {
            return false;
          },
        };
      };
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    document.body.innerHTML = "";
  });

  async function mountStep(audioData = null) {
    const stepRef = React.createRef();
    const onAudioChange = vi.fn();
    let form;
    await act(async () => {
      root = createRoot(container);
      root.render(
        <Harness
          stepRef={stepRef}
          onForm={(f) => {
            form = f;
          }}
          onAudioChange={onAudioChange}
          audioData={audioData}
        />
      );
    });
    await flush();
    return { form, stepRef, onAudioChange };
  }

  async function recordThenStop() {
    await act(async () => {
      buttonByText("Record Audio")?.click();
    });
    await flush();
    await act(async () => {
      buttonByText("Stop")?.click();
    });
    await flush();
  }

  it("returns true and skips upload when there is no pending recording", async () => {
    const { stepRef } = await mountStep();
    let ok;
    await act(async () => {
      ok = await stepRef.current.flushPendingAudio();
    });
    expect(ok).toBe(true);
    expect(uploadAudioToS3).not.toHaveBeenCalled();
  });

  it("uploads a stopped unsaved recording (forgot Save, then Continue)", async () => {
    const { form, stepRef, onAudioChange } = await mountStep();
    await recordThenStop();
    expect(buttonByText("Save Recording")).toBeTruthy();

    let ok;
    await act(async () => {
      ok = await stepRef.current.flushPendingAudio();
    });
    expect(ok).toBe(true);
    expect(uploadAudioToS3).toHaveBeenCalledTimes(1);
    expect(onAudioChange).toHaveBeenCalledWith(
      expect.objectContaining({ fileUrl: "https://cdn.example/voice.webm" })
    );
    expect(form.getFieldValue("audio")?.fileUrl).toBe("https://cdn.example/voice.webm");
    expect(container.textContent).toContain("Audio saved");
  });

  it("stops an in-progress recording then uploads", async () => {
    const { stepRef } = await mountStep();
    await act(async () => {
      buttonByText("Record Audio")?.click();
    });
    await flush();
    expect(container.textContent).toContain("Recording");

    let ok;
    await act(async () => {
      ok = await stepRef.current.flushPendingAudio();
    });
    expect(ok).toBe(true);
    expect(uploadAudioToS3).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("Audio saved");
  });

  it("stays on the unsaved preview when upload fails", async () => {
    uploadAudioToS3.mockRejectedValueOnce(new Error("S3 down"));
    const { stepRef, onAudioChange } = await mountStep();
    await recordThenStop();

    let ok;
    await act(async () => {
      ok = await stepRef.current.flushPendingAudio();
    });
    expect(ok).toBe(false);
    expect(onAudioChange).not.toHaveBeenCalled();
    expect(buttonByText("Save Recording")).toBeTruthy();
  });

  it("does not upload after the user discards the take", async () => {
    const { stepRef } = await mountStep();
    await recordThenStop();
    const save = buttonByText("Save Recording");
    const trash = save?.parentElement?.querySelectorAll("button")[1];
    await act(async () => {
      trash?.click();
    });
    await flush();

    let ok;
    await act(async () => {
      ok = await stepRef.current.flushPendingAudio();
    });
    expect(ok).toBe(true);
    expect(uploadAudioToS3).not.toHaveBeenCalled();
    expect(buttonByText("Record Audio")).toBeTruthy();
  });

  it("skips upload when audio is already saved", async () => {
    const { stepRef } = await mountStep({
      fileUrl: "https://cdn.example/saved.webm",
      fileName: "saved.webm",
    });
    let ok;
    await act(async () => {
      ok = await stepRef.current.flushPendingAudio();
    });
    expect(ok).toBe(true);
    expect(uploadAudioToS3).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Audio saved");
  });
});
