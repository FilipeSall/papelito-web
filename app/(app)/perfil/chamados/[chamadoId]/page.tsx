import Link from "next/link";
import { notFound } from "next/navigation";

import { getAuthenticatedProfile } from "../../_lib/get-authenticated-profile";
import { ChamadoOrderPanel, ChamadoThreadPanel, getChamado } from "@/features/chamados";

export default async function ProfileChamadoPage({
  params,
}: {
  params: Promise<{ chamadoId: string }>;
}) {
  const { chamadoId } = await params;
  const [chamado, profile] = await Promise.all([getChamado(chamadoId), getAuthenticatedProfile()]);

  if (!chamado) notFound();

  return (
    <section className="flex flex-col gap-6">
      <Link
        className="inline-flex w-fit items-center gap-2 border-b-2 border-transparent text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 transition-colors hover:border-[#1a1a1a] hover:text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
        href="/perfil/chamados"
      >
        <svg aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Voltar aos chamados
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <ChamadoThreadPanel initialChamado={chamado} viewerName={profile?.name ?? "Você"} />
        <ChamadoOrderPanel
          fallbackOrderNumber={chamado.orderNumber}
          order={chamado.order}
          reasonLabel={chamado.reasonLabel}
          role="customer"
        />
      </div>
    </section>
  );
}
