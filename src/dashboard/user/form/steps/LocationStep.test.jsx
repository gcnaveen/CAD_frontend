import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Form } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LocationStep from "./LocationStep.jsx";

vi.mock("../../../../services/masters/districtService.js", () => ({
  getActiveDistricts: vi.fn(async () => ({ data: [] })),
}));
vi.mock("../../../../services/masters/talukaService.js", () => ({
  getTalukasByDistrict: vi.fn(async () => ({ data: [] })),
}));
vi.mock("../../../../services/masters/hobliService.js", () => ({
  getHoblisByTaluka: vi.fn(async () => ({ data: [] })),
}));
vi.mock("../../../../services/masters/villageService.js", () => ({
  getVillages: vi.fn(async () => ({ data: [] })),
}));

function Harness() {
  const [form] = Form.useForm();
  return (
    <Form form={form}>
      <LocationStep form={form} />
    </Form>
  );
}

describe("LocationStep drawing type guide", () => {
  let root;
  let container;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
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
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("opens an info popup with dummy examples and separate prices", async () => {
    await act(async () => {
      root.render(<Harness />);
    });

    const infoBtn = container.querySelector('button[aria-label="Drawing type information"]');
    expect(infoBtn).toBeTruthy();

    await act(async () => {
      infoBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialog = document.body.querySelector(".ant-modal");
    expect(dialog?.textContent).toMatch(/Drawing type guide/i);
    expect(dialog?.textContent).toMatch(/One survey number converted into a single CAD drawing/i);
    expect(dialog?.textContent).toMatch(/Two or more survey numbers combined into one CAD drawing/i);
    expect(dialog?.textContent).toMatch(/₹500/);
    expect(dialog?.textContent).toMatch(/₹700/);
    expect(dialog?.querySelector('img[alt="Example single sketch drawing"]')).toBeTruthy();
    expect(dialog?.querySelector('img[alt="Example joint sketch drawing"]')).toBeTruthy();
  });
});
