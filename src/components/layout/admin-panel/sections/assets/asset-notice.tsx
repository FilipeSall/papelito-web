import { ALERT_ERROR_CLASS, ALERT_SUCCESS_CLASS, ALERT_WARNING_CLASS } from "./field-classes";

export type AssetNoticeState = {
  message: string;
  tone: "error" | "success";
};

export function AssetNotice({ notice }: { notice: AssetNoticeState }) {
  if (notice.tone === "success") {
    return <output className={`block ${ALERT_SUCCESS_CLASS}`}>✓ {notice.message}</output>;
  }

  return (
    <p className={ALERT_ERROR_CLASS} role="alert">
      ⚠ {notice.message}
    </p>
  );
}

export function AssetWarning({ children }: { children: React.ReactNode }) {
  return (
    <p className={ALERT_WARNING_CLASS} role="alert">
      ⚠ {children}
    </p>
  );
}
