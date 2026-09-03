import type { Session } from "next-auth";

/**
 * Estado comercial da conta lido da sessão.
 *
 * Serve para desabilitar CTA antes do clique. A autorização de verdade continua no WordPress —
 * um `false` aqui nunca libera nada, só evita um caminho que o backend recusaria.
 */
export function isAccountSuspended(session: Session | null | undefined): boolean {
  return session?.b2b?.accountStatus === "suspended";
}
