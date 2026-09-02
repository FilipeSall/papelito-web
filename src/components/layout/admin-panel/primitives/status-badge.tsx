export type StatusBadgeTone = "success" | "warning" | "critical" | "strong" | "default";

export function StatusBadge({
  label,
  tone: explicitTone,
  className: extraClassName,
}: {
  label: string;
  tone?: StatusBadgeTone;
  className?: string;
}) {
  const normalized = label.toLowerCase();
  const tone =
    explicitTone ??
    (/(concluido|processing|processando|approved|aprovado|paid|pago|live|stable|ready)/.test(
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
          : "default");

  // Mesma gramatica de UserRoleBadge/UserStatusBadge: borda preta de 2px, caixa alta
  // pesada e amarelo da marca no estado positivo. O painel tem uma identidade de
  // status so, e nao uma por tabela.
  const toneClassName =
    tone === "strong"
      ? "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow"
      : tone === "success"
        ? "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]"
      : tone === "warning"
        ? "border-[#1a1a1a] bg-[#faf8f2] text-[#1a1a1a]"
        : tone === "critical"
          ? "border-[#1a1a1a] bg-[#c0392b] text-white"
          : "border-[#1a1a1a] bg-white text-[#1a1a1a]";

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center justify-center border-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
        toneClassName,
        extraClassName ?? "",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export function badge(status: string) {
  return <StatusBadge label={status} />;
}
