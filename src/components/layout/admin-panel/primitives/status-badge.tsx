export function StatusBadge({
  label,
  className: extraClassName,
}: {
  label: string;
  className?: string;
}) {
  const normalized = label.toLowerCase();
  const tone =
    /(concluido|processing|processando|approved|aprovado|paid|pago|live|stable|ready)/.test(
      normalized,
    )
      ? "success"
      : /(falhou|failed|cancelado|cancelled|rejected|paused|reembolsado|refunded)/.test(
            normalized,
          )
        ? "critical"
        : /(warning|review|draft|queued|pendente|pending|em espera|on hold|on-hold)/.test(
              normalized,
            )
          ? "warning"
          : "default";

  const toneClassName =
    tone === "success"
      ? "border-[#97b38e] bg-[#e4efe0] text-[#28422d]"
      : tone === "warning"
        ? "border-[#d7c98f] bg-[#f4edd3] text-[#5d4d1b]"
        : tone === "critical"
          ? "border-[#d7b0aa] bg-[#f3e3df] text-[#7a3428]"
          : "border-[#231f20]/14 bg-[#231f20] text-[#ffe500]";

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center justify-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
        toneClassName,
        extraClassName ?? "",
      ].join(" ")}
      style={{ fontFamily: "var(--font-admin-mono)" }}
    >
      {label}
    </span>
  );
}

export function badge(status: string) {
  return <StatusBadge label={status} />;
}
