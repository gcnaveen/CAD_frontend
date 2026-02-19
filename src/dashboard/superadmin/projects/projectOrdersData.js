// Shared dummy data for current orders and project history

export const buildOrder = (overrides = {}) => ({
  id: "1",
  orderDate: "2025-01-28",
  name: "Juan Dela Cruz",
  phoneNumber: "+63 912 345 6789",
  sketchDetails: {
    description:
      "Survey sketch and site plan for residential plot, Lot 5 Block 2, Barangay Amas.",
    uploadedFiles: [
      { name: "survey_sketch.pdf", url: "#" },
      { name: "site_plan.dwg", url: "#" },
    ],
  },
  assignedCadCenterId: "1",
  cadFiles: [
    { name: "cad_output_v1.dwg", url: "#" },
    { name: "cad_output_v1.pdf", url: "#" },
  ],
  status: "approved",
  note: "",
  paymentStatus: "paid",
  ...overrides,
});

// Current project orders (in progress / active)
export const DUMMY_CURRENT_ORDERS = [
  buildOrder({
    id: "cur-1",
    orderDate: "2025-02-01",
    name: "Maria Santos",
    phoneNumber: "+63 918 111 2233",
    status: "need_changes",
    note: "Please adjust boundary lines per latest survey.",
    paymentStatus: "pending",
  }),
  buildOrder({
    id: "cur-2",
    orderDate: "2025-01-30",
    name: "Roberto Reyes",
    phoneNumber: "+63 917 444 5566",
    assignedCadCenterId: "2",
    status: "approved",
    paymentStatus: "paid",
  }),
  buildOrder({
    id: "cur-3",
    orderDate: "2025-01-29",
    name: "Ana Garcia",
    phoneNumber: "+63 919 777 8899",
    status: "approved",
    paymentStatus: "pending",
  }),
  buildOrder({
    id: "cur-4",
    orderDate: "2025-01-28",
    name: "Carlos Mendoza",
    phoneNumber: "+63 915 000 1122",
    assignedCadCenterId: null,
    cadFiles: [],
    status: "approved",
    paymentStatus: "unpaid",
  }),
  buildOrder({
    id: "cur-5",
    orderDate: "2025-01-27",
    name: "Elena Torres",
    phoneNumber: "+63 916 333 4455",
    status: "rejected",
    note: "",
    paymentStatus: "unpaid",
  }),
];

// Project history: completed, pending, rejected
export const DUMMY_PROJECT_HISTORY = [
  buildOrder({
    id: "hist-1",
    orderDate: "2025-01-25",
    name: "Pedro Lopez",
    phoneNumber: "+63 912 555 6677",
    status: "approved",
    paymentStatus: "paid",
  }),
  buildOrder({
    id: "hist-2",
    orderDate: "2025-01-24",
    name: "Carmen Diaz",
    phoneNumber: "+63 918 888 9900",
    status: "rejected",
    note: "Incomplete survey data.",
    paymentStatus: "unpaid",
  }),
  buildOrder({
    id: "hist-3",
    orderDate: "2025-01-23",
    name: "Jose Fernandez",
    phoneNumber: "+63 917 222 3344",
    status: "approved",
    paymentStatus: "paid",
  }),
  buildOrder({
    id: "hist-4",
    orderDate: "2025-01-22",
    name: "Rosa Martinez",
    phoneNumber: "+63 919 666 7788",
    status: "need_changes",
    note: "Revert to previous version and apply new offsets.",
    paymentStatus: "pending",
  }),
  buildOrder({
    id: "hist-5",
    orderDate: "2025-01-21",
    name: "Antonio Cruz",
    phoneNumber: "+63 915 999 0011",
    status: "approved",
    paymentStatus: "paid",
  }),
];
