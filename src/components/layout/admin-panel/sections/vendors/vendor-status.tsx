import type { AdminVendorRowStatus } from "@/lib/server/admin-vendors";

type VendorStatus = AdminVendorRowStatus;

const LABELS: Record<VendorStatus, string> = {
  pending: "Pendente",
  incomplete: "Cadastro incompleto",
  approved: "Aprovado",
  rejected: "Rejeitado",
  none: "Sem triagem",
};

const TONE_CLASSES: Record<VendorStatus, string> = {
  pending: "border-[#d7c98f] bg-[#f4edd3] text-[#5d4d1b]",
  incomplete: "border-[#d6b06b] bg-[#fff1d6] text-[#7a4d12]",
  approved: "border-[#97b38e] bg-[#e4efe0] text-[#28422d]",
  rejected: "border-[#d7b0aa] bg-[#f3e3df] text-[#7a3428]",
  none: "border-[#231f20]/14 bg-[#231f20] text-[#ffe500]",
};

export function VendorStatusBadge({
  status,
  className,
}: {
  status: VendorStatus;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex min-h-7 items-center justify-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
        TONE_CLASSES[status],
        className ?? "",
      ].join(" ")}
      style={{ fontFamily: "var(--font-admin-mono)" }}
    >
      {LABELS[status]}
    </span>
  );
}

export function vendorStatusLabel(status: VendorStatus) {
  return LABELS[status];
}
