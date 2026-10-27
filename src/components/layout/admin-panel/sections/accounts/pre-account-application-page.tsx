import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { AdminCompanyApplicationDetail } from "@/lib/server/admin-users";

import { FOCUS_RING } from "../../primitives";
import { CompanyApplicationReview } from "../company-application-review";

import { SectionHeading } from "./accounts-shell";

/**
 * Página de decisão de uma candidatura pré-conta: dados informados, documento e Aprovar/Reprovar.
 * Existe porque a candidatura ainda não tem `wp_user`, então não cabe na página de detalhe da conta.
 * `backHref` devolve o admin para a listagem de onde ele veio, com a mesma aba e os mesmos filtros.
 */
export function PreAccountApplicationPage({
  application,
  backHref,
}: Readonly<{
  application: AdminCompanyApplicationDetail;
  backHref: string;
}>) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className={[
            "inline-flex items-center gap-2 border-2 border-[#1a1a1a] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow",
            FOCUS_RING,
          ].join(" ")}
          href={backHref}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Voltar para contas
        </Link>
      </div>

      <SectionHeading
        description="Confira os dados e o documento enviado. Aprovar cria a conta e a empresa; reprovar encerra a candidatura."
        title="Candidatura pré-conta"
      />

      <CompanyApplicationReview
        apiBasePath="/api/admin/pre-account-applications"
        initialData={{ current: application, history: [application] }}
      />
    </div>
  );
}
