import React from "react";
import { Table } from "antd";

/**
 * Reusable table component using Ant Design.
 * @param {Array} columns - Ant Design table columns (key, title, dataIndex, render, etc.)
 * @param {Array} dataSource - Array of row objects
 * @param {string} title - Optional table heading
 * @param {string} rowKey - Row key field (default: 'key' or first column's dataIndex)
 * @param {object} scroll - Table scroll config (e.g. { x: 'max-content' } for horizontal scroll on mobile)
 * @param  {...object} rest - Other antd Table props (pagination, loading, etc.)
 */
const TableComponent = ({
  columns = [],
  dataSource = [],
  title,
  rowKey = "key",
  scroll = { x: "max-content" },
  ...rest
}) => {
  const resolvedRowKey =
    rowKey ||
    (columns[0]?.dataIndex ? String(columns[0].dataIndex) : "key");

  return (
    <div className="table-component theme-animate-surface w-full overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
      {title && (
        <div className="border-b border-line px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="font-semibold text-fg text-base sm:text-lg">
            {title}
          </h2>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={resolvedRowKey}
        scroll={scroll}
        pagination={
          rest.pagination !== undefined
            ? rest.pagination
            : {
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} items`,
                pageSize: 10,
                responsive: true,
                size: "small",
              }
        }
        size="small"
        className="order-history-table"
        {...rest}
      />
    </div>
  );
};

export default TableComponent;
