import Link from "next/link";

import { getPendingInvitationPreview } from "@/lib/server/company-invitation-preview";

/**
 * Aviso de convite pendente. Roda no servidor porque o token do convite só existe em cookie
 * HttpOnly: perguntar isso do cliente gerava um 404 garantido em toda rota de `/perfil`.
 */
export async function PendingInvitationNotice() {
  const invitation = await getPendingInvitationPreview();

  if (invitation.kind !== "ok") return null;

  return (
    <div className="mb-7 flex flex-col gap-4 border-2 border-[#1a1a1a] bg-brand-yellow px-5 py-4 shadow-[5px_5px_0px_#1a1a1a] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
          Convite pendente
        </p>
        <p className="mt-1 text-sm font-semibold text-[#1a1a1a]">
          Entre para concluir seu vínculo com {invitation.companyName || "a empresa"}.
        </p>
      </div>
      <Link
        href="/convite"
        className="inline-flex h-10 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 text-xs font-black uppercase tracking-widest text-brand-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
      >
        Continuar convite
      </Link>
    </div>
  );
}
