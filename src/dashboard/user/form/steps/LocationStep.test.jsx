import React, { useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Form } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTalukasByDistrict } from "../../../../services/masters/talukaService.js";
import { getHoblisByTaluka } from "../../../../services/masters/hobliService.js";
import { getVillages } from "../../../../services/masters/villageService.js";
import LocationStep from "./LocationStep.jsx";

vi.mock("../../../../services/masters/districtService.js", () => ({
  getActiveDistricts: vi.fn(async () => ({
    data: [{ _id: "d1", name: "District 1" }],
  })),
}));
vi.mock("../../../../services/masters/talukaService.js", () => ({
  getTalukasByDistrict: vi.fn(async () => ({
    data: [{ _id: "t1", name: "Taluka 1" }],
  })),
}));
vi.mock("../../../../services/masters/hobliService.js", () => ({
  getHoblisByTaluka: vi.fn(async () => ({
    data: [{ _id: "h1", name: "Hobli 1" }],
  })),
}));
vi.mock("../../../../services/masters/villageService.js", () => ({
  getVillages: vi.fn(async () => ({
    data: [{ _id: "v1", name: "Village 1" }],
  })),
}));

function setupMatchMedia() {
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
}

describe("LocationStep drawing type guide", () => {
  let root;
  let container;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    setupMatchMedia();
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("opens an info popup with dummy examples and separate prices", async () => {
    function GuideHarness() {
      const [form] = Form.useForm();
      return (
        <Form form={form}>
          <LocationStep form={form} />
        </Form>
      );
    }

    await act(async () => {
      root.render(<GuideHarness />);
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

describe("LocationStep remount preserves cascade values", () => {
  let root;
  let container;
  let formApi;
  let setShowLocationApi;

  function Parent() {
    const [form] = Form.useForm();
    const [showLocation, setShowLocation] = useState(true);
    formApi = form;
    setShowLocationApi = setShowLocation;
    return (
      <Form form={form}>
        {showLocation ? <LocationStep form={form} /> : <div data-testid="other-step" />}
      </Form>
    );
  }

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    formApi = null;
    setShowLocationApi = null;
    container = document.createElement("div");
    document.body.appendChild(container);
    setupMatchMedia();
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("keeps taluka/hobli/village after unmount and remount (back navigation)", async () => {
    await act(async () => {
      root.render(<Parent />);
    });

    await act(async () => {
      formApi.setFieldsValue({
        district: "d1",
        taluka: "t1",
        hobli: "h1",
        village: "v1",
        districtLabel: "District 1",
        talukaLabel: "Taluka 1",
        hobliLabel: "Hobli 1",
        villageLabel: "Village 1",
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      setShowLocationApi(false);
    });

    expect(container.querySelector('[data-testid="other-step"]')).toBeTruthy();

    await act(async () => {
      setShowLocationApi(true);
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const values = formApi.getFieldsValue(true);
    expect(values.district).toBe("d1");
    expect(values.taluka).toBe("t1");
    expect(values.hobli).toBe("h1");
    expect(values.village).toBe("v1");
    expect(getTalukasByDistrict).toHaveBeenCalled();
    expect(getHoblisByTaluka).toHaveBeenCalled();
    expect(getVillages).toHaveBeenCalled();
  });
});
