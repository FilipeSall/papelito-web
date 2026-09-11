import type { ChamadoRole } from "../types/chamado";

export type ChamadoMessageSide = "left" | "right";

/**
 * Lado da conversa a partir de quem escreveu. Quem pediu ajuda fica à esquerda e quem atende
 * (vendor e, quando escalado, a Papelito) fica à direita.
 *
 * Não use `isMine` para isso: ele é relativo a quem lê, e no /admin — que não é parte da
 * conversa — é `false` para todas as mensagens, empilhando cliente e vendor no mesmo lado.
 */
export function chamadoMessageSide(role: ChamadoRole): ChamadoMessageSide {
  return role === "customer" ? "left" : "right";
}
