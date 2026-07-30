import { describe, expect, it } from "vitest";
import {
  extractUploadsListResponse,
  mapAdminAssignmentTableRows,
} from "./adminAssignmentsTableService.js";

describe("adminAssignmentsTableService request state", () => {
  it("extractUploadsListResponse keeps total while page rows are shorter", () => {
    const { uploads, meta } = extractUploadsListResponse({
      data: [{ _id: "1", status: "PENDING" }, { _id: "2", status: "ASSIGNED" }],
      meta: { page: 1, limit: 10, total: 96, totalPages: 10 },
    });
    expect(uploads).toHaveLength(2);
    expect(meta.total).toBe(96);
  });

  it("mapAdminAssignmentTableRows is sync and uses embedded assignment", () => {
    const rows = mapAdminAssignmentTableRows(
      [
        {
          _id: "u1",
          status: "ASSIGNED",
          assignment: {
            _id: "a1",
            assignedTo: { _id: "c1", name: { first: "Ada", last: "CAD" } },
          },
        },
      ],
      [{ _id: "c1", name: { first: "Ada", last: "CAD" }, role: "CAD" }]
    );
    expect(rows[0].assignmentId).toBe("a1");
    expect(rows[0].assignedCadUserLabel).toMatch(/Ada/i);
  });
});
