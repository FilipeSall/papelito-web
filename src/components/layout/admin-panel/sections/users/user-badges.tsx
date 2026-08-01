type UserRoleBadgeTone = "admin" | "customer" | "other" | "vendor";
type UserStatusBadgeTone = "active" | "admin" | "pending" | "rejected" | "vendor";

function roleTone(label: string): UserRoleBadgeTone {
  const normalized = label.trim().toLowerCase();

  if (normalized.includes("admin")) {
    return "admin";
  }

  if (normalized.includes("vendor")) {
    return "vendor";
  }

  if (normalized.includes("customer")) {
    return "customer";
  }

  return "other";
}

function statusTone(label: string): UserStatusBadgeTone {
  const normalized = label.trim().toLowerCase();

  if (normalized.includes("rejeitado")) {
    return "rejected";
  }

  if (normalized.includes("pendente") || normalized.includes("análise")) {
    return "pending";
  }

  if (normalized.includes("vendor ativo")) {
    return "vendor";
  }

  if (normalized.includes("admin")) {
    return "admin";
  }

  return "active";
}

const ROLE_TONE_CLASSES: Record<UserRoleBadgeTone, string> = {
  admin: "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]",
  customer: "border-[#1a1a1a] bg-[#faf8f2] text-[#1a1a1a]",
  other: "border-[#1a1a1a] bg-white text-[#1a1a1a]",
  vendor: "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]",
};

const STATUS_TONE_CLASSES: Record<UserStatusBadgeTone, string> = {
  active: "border-[#1a1a1a] bg-[#faf8f2] text-[#1a1a1a]",
  admin: "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]",
  pending: "border-[#1a1a1a] bg-[#faf8f2] text-[#1a1a1a]",
  rejected: "border-[#1a1a1a] bg-[#c0392b] text-white",
  vendor: "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]",
};

function baseClassName(className?: string) {
  return [
    "inline-flex min-h-7 items-center justify-center border-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
    className ?? "",
  ].join(" ");
}

export function UserRoleBadge({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  const normalizedLabel = label.trim() || "Outro";

  return (
    <span
      className={[baseClassName(className), ROLE_TONE_CLASSES[roleTone(normalizedLabel)]].join(" ")}
    >
      {normalizedLabel}
    </span>
  );
}

export function UserStatusBadge({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  const normalizedLabel = label.trim() || "Ativa";

  return (
    <span
      className={[
        baseClassName(className),
        STATUS_TONE_CLASSES[statusTone(normalizedLabel)],
      ].join(" ")}
    >
      {normalizedLabel}
    </span>
  );
}
