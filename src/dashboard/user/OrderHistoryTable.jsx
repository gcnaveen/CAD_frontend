import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Tag } from "antd";
import { ArrowLeft, Lock, FileCheck, Eye } from "lucide-react";
import TableComponent from "./component/TableComponent";

const DUMMY_ORDERS = [
  {
    key: "1",
    projectId: "PRJ-001",
    projectDetails: "Survey No. 123/1, Bangalore North",
    cadFileStatus: "available",
    paymentStatus: "paid",
  },
  {
    key: "2",
    projectId: "PRJ-002",
    projectDetails: "Survey No. 45/2, Mysore",
    cadFileStatus: "locked",
    paymentStatus: "pending",
  },
  {
    key: "3",
    projectId: "PRJ-003",
    projectDetails: "Survey No. 78/3, Tumakuru",
    cadFileStatus: "available",
    paymentStatus: "paid",
  },
  {
    key: "4",
    projectId: "PRJ-004",
    projectDetails: "Survey No. 12/4, Bangalore Rural",
    cadFileStatus: "locked",
    paymentStatus: "pending",
  },
  {
    key: "5",
    projectId: "PRJ-005",
    projectDetails: "Survey No. 99/5, Belgaum",
    cadFileStatus: "available",
    paymentStatus: "paid",
  },
];

const OrderHistoryTable = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const columns = [
    {
      title: "Sl No",
      key: "slNo",
      width: 72,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Project ID",
      dataIndex: "projectId",
      key: "projectId",
      width: 110,
      ellipsis: true,
    },
    {
      title: "Project Details",
      dataIndex: "projectDetails",
      key: "projectDetails",
      width: 200,
      ellipsis: true,
    },
    {
      title: "CAD File Status",
      dataIndex: "cadFileStatus",
      key: "cadFileStatus",
      width: 140,
      align: "center",
      render: (_, record) => {
        const isPaid = record.paymentStatus === "paid";
        return (
          <span className="inline-flex items-center gap-2 text-gray-600">
            {isPaid ? (
              <>
                <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  Available
                </span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Locked</span>
              </>
            )}
          </span>
        );
      },
    },
    {
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 130,
      align: "center",
      render: (status) =>
        status === "paid" ? (
          <Tag color="success">Paid</Tag>
        ) : (
          <Tag color="warning">Pending</Tag>
        ),
    },
    {
      title: "Action",
      key: "action",
      width: 110,
      align: "center",
      fixed: "right",
      render: (_col, record) => (
        <Button
          type="link"
          size="small"
          icon={<Eye className="h-4 w-4" />}
          onClick={() => {
            if (record?.projectId) {
              // TODO: Navigate to order details or open drawer
            }
          }}
          className="p-0 font-medium text-blue-600 hover:text-blue-700"
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Back button – top left */}
        <div className="mb-4 sm:mb-6">
          <Button
            type="text"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={handleBack}
            className="-ml-1 flex items-center gap-1.5 pl-0 text-gray-600 hover:bg-transparent hover:text-gray-900"
            size="large"
          >
            Back
          </Button>
        </div>

        {/* Page heading */}
        <h1 className="mb-6 text-xl font-semibold text-gray-900 sm:mb-8 sm:text-2xl md:text-3xl">
          Order history
        </h1>

        <TableComponent
          columns={columns}
          dataSource={DUMMY_ORDERS}
          scroll={{ x: 600 }}
        />
      </div>
    </div>
  );
};

export default OrderHistoryTable;
