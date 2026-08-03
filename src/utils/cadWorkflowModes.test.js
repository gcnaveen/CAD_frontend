import { describe, expect, it } from "vitest";
import {
  CAD_PRIMARY_MODE,
  normalizeCadPrimaryMode,
  resolveCadWorkflowUi,
} from "./cadWorkflowModes.js";

describe("cadWorkflowModes (CAD-02)", () => {
  it("normalizes primaryMode aliases", () => {
    expect(normalizeCadPrimaryMode("NEED_CHANGES")).toBe(CAD_PRIMARY_MODE.REVISION);
    expect(normalizeCadPrimaryMode("in-progress")).toBe(CAD_PRIMARY_MODE.UPLOAD);
    expect(normalizeCadPrimaryMode("COMPLETED")).toBe(CAD_PRIMARY_MODE.COMPLETED);
    expect(normalizeCadPrimaryMode("pending_accept")).toBe(CAD_PRIMARY_MODE.ACCEPT);
  });

  it("keeps Upload / Revision / Completed exclusive when primaryMode is set", () => {
    const upload = resolveCadWorkflowUi({
      primaryMode: "UPLOAD",
      exclusiveModes: true,
      isAccepted: true,
      status: "IN_PROGRESS",
    });
    expect(upload.showUploadPanel).toBe(true);
    expect(upload.showRevisionPanel).toBe(false);

    const revision = resolveCadWorkflowUi({
      primaryMode: "REVISION",
      exclusiveModes: true,
      isAccepted: true,
      status: "NEED_CHANGES",
    });
    expect(revision.showUploadPanel).toBe(true);
    expect(revision.showRevisionPanel).toBe(true);

    const completed = resolveCadWorkflowUi({
      primaryMode: "COMPLETED",
      exclusiveModes: true,
      isAccepted: true,
      status: "COMPLETED",
    });
    expect(completed.showUploadPanel).toBe(false);
    expect(completed.showRevisionPanel).toBe(true); // history ok
    expect(completed.showDeliverables).toBe(true);

    const uploadExclusive = resolveCadWorkflowUi({
      primaryMode: "UPLOAD",
      exclusiveModes: true,
      isAccepted: true,
      status: "IN_PROGRESS",
    });
    expect(uploadExclusive.showRevisionPanel).toBe(false);
  });

  it("falls back to status heuristics when BE fields are absent", () => {
    const assigned = resolveCadWorkflowUi({
      status: "ASSIGNED",
      isAccepted: false,
    });
    expect(assigned.primaryMode).toBe(CAD_PRIMARY_MODE.ACCEPT);
    expect(assigned.detailsLocked).toBe(true);
    expect(assigned.exclusiveModes).toBe(true);
  });

  it("keeps status-heuristic modes exclusive (no stacked upload+revision+completed)", () => {
    const inProgress = resolveCadWorkflowUi({
      status: "IN_PROGRESS",
      isAccepted: true,
    });
    expect(inProgress.primaryMode).toBe(CAD_PRIMARY_MODE.UPLOAD);
    expect(inProgress.exclusiveModes).toBe(true);
    expect(inProgress.showUploadPanel).toBe(true);
    expect(inProgress.showRevisionPanel).toBe(false);

    const completed = resolveCadWorkflowUi({
      status: "COMPLETED",
      isAccepted: true,
    });
    expect(completed.primaryMode).toBe(CAD_PRIMARY_MODE.COMPLETED);
    expect(completed.showUploadPanel).toBe(false);
  });
});
