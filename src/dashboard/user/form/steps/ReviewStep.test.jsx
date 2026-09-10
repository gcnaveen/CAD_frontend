import React, { useEffect } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Form } from "antd";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ReviewStep from "./ReviewStep.jsx";

function Harness({ onForm, uploadMode, uploadedDocs }) {
  const [form] = Form.useForm();
  useEffect(() => {
    onForm(form);
  }, [form, onForm]);
  return (
    <Form
      form={form}
      initialValues={{
        uploadMode,
        other_documents: [
          { uid: "o1", name: "ghost.png", status: "done" },
        ],
      }}
    >
      <ReviewStep form={form} uploadedDocs={uploadedDocs} audioData={null} />
    </Form>
  );
}

describe("ReviewStep other documents", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
  });

  it("hides leftover other docs when uploadMode is single", async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        <Harness
          onForm={() => {}}
          uploadMode="single"
          uploadedDocs={{ singleUpload: { fileName: "single.png", fileUrl: "https://cdn.example/s.png" } }}
        />
      );
    });
    expect(container.textContent).toContain("single.png");
    expect(container.textContent).not.toContain("Other Docs");
  });

  it("shows other docs count in normal mode", async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        <Harness
          onForm={() => {}}
          uploadMode="normal"
          uploadedDocs={{ moolaTippani: { fileName: "moola.png", fileUrl: "https://cdn.example/m.png" } }}
        />
      );
    });
    expect(container.textContent).toContain("Other Docs");
    expect(container.textContent).toContain("1 file(s)");
  });
});
