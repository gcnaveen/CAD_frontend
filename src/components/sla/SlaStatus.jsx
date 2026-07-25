import React from "react";
import { Space, Tag, Typography } from "antd";
import {
  SLA_AWAITING_MESSAGE,
  formatSlaAgeHours,
  formatSlaDueAt,
  formatSlaRemaining,
  getSlaPublicPromise,
  getSlaStateLabel,
  getSlaStateTagColor,
  isSlaAwaitingAssignment,
  normalizeSla,
  resolveSla,
} from "../../utils/sla.js";

const { Text } = Typography;

/**
 * Shared SLA display for CAD / surveyor / admin — API `sla` only.
 *
 * @param {{
 *   sla?: any,
 *   entity?: any,
 *   compact?: boolean,
 *   showPromise?: boolean,
 *   showExtensions?: boolean,
 *   extra?: React.ReactNode,
 * }} props
 */
export default function SlaStatus({
  sla: slaProp,
  entity,
  compact = false,
  showPromise = false,
  showExtensions = false,
  extra = null,
}) {
  const sla = normalizeSla(slaProp) || resolveSla(entity);
  if (!sla) {
    return <Text type="secondary">—</Text>;
  }

  if (isSlaAwaitingAssignment(sla)) {
    if (compact) {
      return (
        <Space size={4} wrap>
          <Tag color={getSlaStateTagColor(sla.state)}>
            {getSlaStateLabel(sla.state || "AWAITING_ASSIGNMENT")}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {SLA_AWAITING_MESSAGE}
          </Text>
        </Space>
      );
    }
    return (
      <Space direction="vertical" size={4}>
        <Tag color={getSlaStateTagColor(sla.state || "AWAITING_ASSIGNMENT")}>
          {getSlaStateLabel(sla.state || "AWAITING_ASSIGNMENT")}
        </Tag>
        <Text type="secondary">{SLA_AWAITING_MESSAGE}</Text>
        {showPromise ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {getSlaPublicPromise(sla)}
          </Text>
        ) : null}
        {extra}
      </Space>
    );
  }

  const dueLabel = formatSlaDueAt(sla.dueAt);
  const remaining = formatSlaRemaining(sla);
  const age = formatSlaAgeHours(sla.ageHours);

  if (compact) {
    return (
      <Space size={4} wrap>
        {sla.state ? (
          <Tag color={getSlaStateTagColor(sla.state)}>{getSlaStateLabel(sla.state)}</Tag>
        ) : null}
        {dueLabel ? <span>{dueLabel}</span> : null}
        {remaining ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {remaining}
          </Text>
        ) : null}
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={6} style={{ width: "100%" }}>
      <Space wrap>
        {sla.state ? (
          <Tag color={getSlaStateTagColor(sla.state)}>{getSlaStateLabel(sla.state)}</Tag>
        ) : null}
        {remaining ? <Text strong>{remaining}</Text> : null}
      </Space>
      {dueLabel ? (
        <Text>
          Due: {dueLabel} <Text type="secondary">(IST)</Text>
        </Text>
      ) : (
        <Text type="secondary">No due time</Text>
      )}
      {age ? <Text type="secondary">Age since assign: {age}</Text> : null}
      {showPromise ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {getSlaPublicPromise(sla)}
        </Text>
      ) : null}
      {showExtensions && sla.extensions?.length ? (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Extensions
          </Text>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {sla.extensions.map((ext, i) => {
              const hours = ext?.hours ?? ext?.extendedHours;
              const ms = ext?.ms ?? ext?.extendedMs;
              const reason = ext?.reason || ext?.note || "—";
              const at = formatSlaDueAt(ext?.at ?? ext?.createdAt ?? ext?.extendedAt);
              const amount =
                hours != null
                  ? `+${hours}h`
                  : ms != null
                    ? `+${Math.round(Number(ms) / (1000 * 60 * 60))}h`
                    : "extension";
              return (
                <li key={ext?._id || ext?.id || i} style={{ fontSize: 12 }}>
                  {amount}
                  {at ? ` · ${at}` : ""} — {reason}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {extra}
    </Space>
  );
}
