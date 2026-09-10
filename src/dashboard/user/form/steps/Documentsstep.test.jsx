import React, { useEffect } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Form, Modal } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DocumentsStep from "./Documentsstep.jsx";

vi.mock("antd", async (importOriginal) => {
  const antd = await importOriginal();
  return {
    ...antd,
    Modal: {
      ...antd.Modal,
      confirm: vi.fn(),
    },
  };
});

vi.mock("../../../../services/upload/upload.api.js", () => ({
  deleteUploadedFile: vi.fn(async () => ({})),
}));
vi.mock("../../../../services/upload/upload.service.js", () => ({
  uploadSurveyDocumentToS3: vi.fn(),
  uploadAudioToS3: vi.fn(),
}));

const fileItem = (uid, name) => ({
  uid,
  name,
  fileName: name,
  status: "done",
  url: `https://cdn.example/${name}`,
  fileUrl: `https://cdn.example/${name}`,
  mimeType: "image/png",
  size: 12,
});

function Harness({ onForm, onOtherRemove, onClear, onDocRemove }) {
  const [form] = Form.useForm();
  useEffect(() => {
    onForm(form);
  }, [form, onForm]);
  return (
    <Form form={form} initialValues={{ uploadMode: "normal" }}>
      <DocumentsStep
        form={form}
        onOtherDocumentRemove={onOtherRemove}
        onClearUploads={onClear}
        onDocumentRemove={onDocRemove}
      />
    </Form>
  );
}

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

describe("DocumentsStep upload mode switch", () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    Modal.confirm.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    window.matchMedia = window.matchMedia || function matchMedia() {
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

  async function mountStep() {
    let form;
    const onOtherRemove = vi.fn();
    const onClear = vi.fn();
    const onDocRemove = vi.fn();
    await act(async () => {
      root = createRoot(container);
      root.render(
        <Harness
          onForm={(f) => {
            form = f;
          }}
          onOtherRemove={onOtherRemove}
          onClear={onClear}
          onDocRemove={onDocRemove}
        />
      );
    });
    await flush();
    return { form, onOtherRemove, onClear, onDocRemove };
  }

  it("prompts and clears other_documents when switching normal → single", async () => {
    Modal.confirm.mockImplementation(({ onOk }) => onOk?.());
    const { form, onOtherRemove, onClear, onDocRemove } = await mountStep();

    await act(async () => {
      form.setFieldsValue({
        moolaTippani: [fileItem("m1", "moola.png")],
        other_documents: [fileItem("o1", "other.png")],
      });
    });
    await flush();

    await act(async () => {
      buttonByText("Single Upload").click();
    });
    await flush();

    expect(Modal.confirm).toHaveBeenCalled();
    expect(form.getFieldValue("uploadMode")).toBe("single");
    expect(form.getFieldValue("moolaTippani")).toEqual([]);
    expect(form.getFieldValue("other_documents")).toEqual([]);
    expect(onOtherRemove).toHaveBeenCalledWith("o1");
    expect(onDocRemove).toHaveBeenCalledWith("moolaTippani");
    expect(onClear).toHaveBeenCalledWith("single");

    await act(async () => {
      buttonByText("Normal Upload").click();
    });
    await flush();
    expect(form.getFieldValue("uploadMode")).toBe("normal");
    expect(form.getFieldValue("other_documents")).toEqual([]);
    expect(form.getFieldValue("moolaTippani")).toEqual([]);
  });

  it("shows confirm when only other documents exist", async () => {
    const { form } = await mountStep();
    await act(async () => {
      form.setFieldsValue({ other_documents: [fileItem("o1", "only-other.png")] });
    });
    await flush();
    expect(form.getFieldValue("other_documents")?.length).toBe(1);

    await act(async () => {
      buttonByText("Single Upload").click();
    });
    await flush();
    expect(Modal.confirm).toHaveBeenCalled();
    expect(Modal.confirm.mock.calls[0][0].title).toBe("Switch upload mode?");
  });

  it("keeps other documents when the switch is cancelled", async () => {
    Modal.confirm.mockImplementation(({ onCancel }) => onCancel?.());
    const { form } = await mountStep();
    await act(async () => {
      form.setFieldsValue({
        moolaTippani: [fileItem("m1", "moola.png")],
        other_documents: [fileItem("o1", "keep-other.png")],
      });
    });
    await flush();

    await act(async () => {
      buttonByText("Single Upload").click();
    });
    await flush();

    expect(form.getFieldValue("uploadMode")).toBe("normal");
    expect(form.getFieldValue("other_documents")[0].uid).toBe("o1");
    expect(form.getFieldValue("moolaTippani")[0].uid).toBe("m1");
  });
});
