/**
 * Rótulos de motivo para quando o payload não traz `reasonLabel` — chamado aberto antes do
 * modelo, ou motivo novo no backend. Mapa com fallback em vez de união fechada: um motivo a mais
 * no PHP não pode quebrar a tela.
 */
const REASON_LABELS: Record<string, string> = {
  atraso_entrega: "Atraso na entrega",
  devolucao: "Solicitação de devolução",
  duvida_pedido: "Dúvida sobre o pedido",
  outro: "Outro assunto",
  problema_pagamento: "Problema com o pagamento",
  produto_avariado: "Produto avariado ou com defeito",
  produto_errado: "Recebi o produto errado",
};

export function chamadoReasonLabel(reason: string | null, reasonLabel: string | null): string {
  if (reasonLabel) return reasonLabel;
  if (!reason) return "Atendimento";

  return REASON_LABELS[reason] ?? "Outro assunto";
}
