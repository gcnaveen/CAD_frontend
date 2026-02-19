// Dummy data for CAD center orders (current + all/history)

export const ORDER_STATUS = {
  approved: "approved",
  rejected: "rejected",
  need_changes: "need_changes",
  pending: "pending",
};

const buildOrder = (overrides = {}) => ({
  id: "1",
  orderDate: "2025-01-28",
  orderId: "ORD-001",
  customerName: "Juan Dela Cruz",
  phoneNumber: "+63 912 345 6789",
  status: "pending",
  note: "",
  sketchDetails: {
    description: "Survey sketch and site plan for residential plot.",
    uploadedFiles: [
      { name: "survey_sketch.pdf", url: "#" },
      { name: "site_plan.dwg", url: "#" },
    ],
  },
  cadFiles: [],
  ...overrides,
});

// Current orders (assigned to this CAD center, not yet completed)
export const DUMMY_CURRENT_ORDERS = [
  buildOrder({
    id: "cur-1",
    orderDate: "2025-02-01",
    orderId: "ORD-101",
    customerName: "Maria Santos",
    phoneNumber: "+63 918 111 2233",
    status: "need_changes",
    note: "Please adjust boundary lines per latest survey. Revert section A to previous version.",
    cadFiles: [{ name: "cad_v1.dwg", url: "#" }],
  }),
  buildOrder({
    id: "cur-2",
    orderDate: "2025-01-30",
    orderId: "ORD-102",
    customerName: "Roberto Reyes",
    phoneNumber: "+63 917 444 5566",
    status: "pending",
    cadFiles: [],
  }),
  buildOrder({
    id: "cur-3",
    orderDate: "2025-01-29",
    orderId: "ORD-103",
    customerName: "Ana Garcia",
    phoneNumber: "+63 919 777 8899",
    status: "pending",
    cadFiles: [{ name: "output.dwg", url: "#" }, { name: "output.pdf", url: "#" }],
  }),
  buildOrder({
    id: "cur-4",
    orderDate: "2025-01-28",
    orderId: "ORD-104",
    customerName: "Carlos Mendoza",
    phoneNumber: "+63 915 000 1122",
    status: "need_changes",
    note: "Add missing elevation markers.",
    cadFiles: [{ name: "draft.dwg", url: "#" }],
  }),
];

// All orders (current + completed/rejected for order history)
export const DUMMY_ALL_ORDERS = [
  ...DUMMY_CURRENT_ORDERS,
  buildOrder({
    id: "all-1",
    orderDate: "2025-01-27",
    orderId: "ORD-100",
    customerName: "Elena Torres",
    phoneNumber: "+63 916 333 4455",
    status: "approved",
    cadFiles: [{ name: "final.dwg", url: "#" }, { name: "final.pdf", url: "#" }],
  }),
  buildOrder({
    id: "all-2",
    orderDate: "2025-01-26",
    orderId: "ORD-099",
    customerName: "Pedro Lopez",
    phoneNumber: "+63 912 555 6677",
    status: "rejected",
    note: "Incomplete survey data provided.",
    cadFiles: [],
  }),
  buildOrder({
    id: "all-3",
    orderDate: "2025-01-25",
    orderId: "ORD-098",
    customerName: "Carmen Diaz",
    phoneNumber: "+63 918 888 9900",
    status: "approved",
    cadFiles: [{ name: "cad_final.dwg", url: "#" }],
  }),
];

// Stats for dashboard (derived or separate dummy)
export const DUMMY_ORDER_STATS = {
  total: 48,
  approved: 32,
  rejected: 6,
  needChanges: 4,
  pending: 6,
};
