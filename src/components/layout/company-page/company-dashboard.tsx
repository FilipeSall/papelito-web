"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";

import { fetchCompanyContext } from "@/features/company/client/company-client";
import type { CompanyContext } from "@/features/company/types/company";
import { blockMessageFor, roleLabel } from "@/features/company/utils/labels";

import { CompanyAccessRequestsSection } from "./company-access-requests-section";
import { CompanyBlockMessage } from "./company-block-message";
import { CompanyInvitationsSection } from "./company-invitations-section";
import { CompanyMembersSection } from "./company-members-section";
import { CompanyRequestAccessForm } from "./company-request-access-form";
import { CompanyOnboardingForm } from "./company-onboarding-form";
import { CompanySelector } from "./company-selector";
import { CompanyDetailsSection } from "./company-details-section";
import { CompanyAuditSection } from "./company-audit-section";

type CompanyDashboardProps = {
  initialContext: CompanyContext;
};

/**
 * Painel da empresa (/perfil/empresa). Compõe status, seletor de empresa, membros, convites e
 * solicitações. Após qualquer mutação relevante, recarrega o contexto autoritativo e atualiza a
 * sessão NextAuth (update()) para que canPurchase/role reflitam o estado real.
 */
export function CompanyDashboard({ initialContext }: CompanyDashboardProps) {
  const { update } = useSession();
  const [context, setContext] = useState<CompanyContext>(initialContext);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const result = await fetchCompanyContext();
    if (result.ok) {
      setContext(result.data);
    }
    // Propaga o novo contexto para a sessão (canPurchase, role, empresa ativa).
    await update({ refreshB2b: true });
    setRefreshing(false);
  }, [update]);

  const block = blockMessageFor(context);
  const hasCompany = context.onboardingStatus === "complete";
  const selectionRequired = context.onboardingStatus === "company_selection_required";
  const hasNoCompany = context.onboardingStatus === "none";
  const needsIdentity = context.identityStatus !== "verified";
  const legacyNeedsMigration =
    context.isLegacyCohort === true &&
    context.isB2bCohort !== true &&
    !["migrated", "exempt", "pending_company_review", "pending_membership_approval"].includes(
      context.legacyMigrationStatus ?? "",
    );

  return (
    <div className="space-y-8" aria-busy={refreshing}>
      <header className="space-y-1">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#231f20]/70">
          Minha empresa
        </p>
        <h2 className="text-2xl font-black uppercase -tracking-tight text-[#1a1a1a]">
          {hasCompany
            ? context.availableCompanies.find((c) => c.companyId === context.companyId)?.legalName ??
              "Empresa"
            : "Empresa B2B"}
        </h2>
        {hasCompany ? (
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#231f20]">
            Seu papel: {roleLabel(context.membershipRole)} ·{" "}
            {context.canPurchase ? "Compra liberada" : "Compra bloqueada"}
          </p>
        ) : null}
      </header>

      {block ? (
        <CompanyBlockMessage
          title={block.title}
          body={block.body}
          cta={hasNoCompany ? { href: "/cadastro?intent=company", label: "Cadastrar minha empresa" } : undefined}
        />
      ) : null}

      {needsIdentity || legacyNeedsMigration ? (
        <CompanyOnboardingForm
          isLegacyMigration={legacyNeedsMigration}
          onComplete={refresh}
        />
      ) : null}

      {(selectionRequired || context.availableCompanies.length > 1) && (
        <CompanySelector
          companies={context.availableCompanies}
          activeCompanyId={context.companyId}
          onSelected={refresh}
        />
      )}

      {hasNoCompany && !needsIdentity ? <CompanyRequestAccessForm onRequested={refresh} /> : null}

      {hasCompany ? (
        <>
          <CompanyDetailsSection context={context} onChanged={refresh} />
          <CompanyAccessRequestsSection viewerRole={context.membershipRole} onChanged={refresh} />
          <CompanyMembersSection viewerRole={context.membershipRole} onChanged={refresh} />
          <CompanyInvitationsSection viewerRole={context.membershipRole} />
          <CompanyAuditSection role={context.membershipRole} />
        </>
      ) : null}
    </div>
  );
}
