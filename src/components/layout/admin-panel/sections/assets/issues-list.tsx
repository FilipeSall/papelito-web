import { ALERT_WARNING_CLASS } from "./field-classes";

export function IssuesList({ issues }: { issues: string[] }) {
  return <div className={`mb-4 ${ALERT_WARNING_CLASS}`}>⚠ {issues.join(" ")}</div>;
}
