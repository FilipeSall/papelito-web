/** Tom de um aviso do painel financeiro; erro é anunciado como alerta, o resto como status. */
export type PaymentNoticeTone = "error" | "info" | "success";

/** Aviso curto exibido no topo do painel financeiro. */
export type PaymentNoticeState = {
  tone: PaymentNoticeTone;
  title?: string;
  message: string;
};

const TONE_CLASS: Record<PaymentNoticeTone, string> = {
  error: "border-[#c0392b] bg-[#f7e6e2] text-[#7a3428] shadow-[4px_4px_0px_#c0392b]",
  info: "border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]",
  success: "border-[#15803d] bg-white text-[#14532d] shadow-[4px_4px_0px_#15803d]",
};

/**
 * Aviso do painel financeiro (retorno do OAuth, resultado de ação). Não renderiza nada sem aviso,
 * para não deixar região viva vazia competindo com outros anúncios.
 */
export function PaymentNotice({ notice }: Readonly<{ notice: PaymentNoticeState | null }>) {
  if (!notice) return null;

  return (
    <div className={`border-2 px-4 py-3 text-sm ${TONE_CLASS[notice.tone]}`} role={notice.tone === "error" ? "alert" : "status"}>
      {notice.title ? <p className="text-[11px] font-black uppercase tracking-[0.18em]">{notice.title}</p> : null}
      <p className="font-semibold">{notice.message}</p>
    </div>
  );
}
