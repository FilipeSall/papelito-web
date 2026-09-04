"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";

import {
  ProfilePageTitle,
  ProfilePanel,
  ProfilePanelBody,
} from "@/components/layout/profile-page";
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
import { CpfCompletionForm } from "./cpf-completion-form";

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
  const selectionRequired =
    context.onboardingStatus === "company_selection_required";
  const hasNoCompany = context.onboardingStatus === "none";
  const hasExistingCompany =
    context.companyId !== null ||
    context.availableCompanies.length > 0 ||
    context.membershipStatus !== null;
  const needsIdentity = context.identityStatus !== "verified";
  const legacyNeedsMigration =
    context.isLegacyCohort === true &&
    context.isB2bCohort !== true &&
    ![
      "migrated",
      "exempt",
      "pending_company_review",
      "pending_membership_approval",
    ].includes(context.legacyMigrationStatus ?? "");

  const companyName = hasCompany
    ? (context.availableCompanies.find(
        (company) => company.companyId === context.companyId,
      )?.legalName ?? "Empresa")
    : "Empresa B2B";
  const showSelector =
    selectionRequired || context.availableCompanies.length > 1;
  const hasEnvelopedContent = showSelector || hasCompany;

  return (
    <div aria-busy={refreshing} className="flex flex-col gap-7">
      <ProfilePageTitle
        description={
          hasCompany
            ? `Seu papel: ${roleLabel(context.membershipRole)} · ${
                context.canPurchase ? "compra liberada" : "compra bloqueada"
              }.`
            : "Vincule um CNPJ para comprar em nome da sua empresa."
        }
        title={companyName}
      />

      {block ? (
        <CompanyBlockMessage
          body={block.body}
          cta={
            hasNoCompany
              ? {
                  href: "/cadastro?intent=company",
                  label: "Cadastrar minha empresa",
                }
              : undefined
          }
          title={block.title}
        />
      ) : null}

      {legacyNeedsMigration || (!hasExistingCompany && needsIdentity) ? (
        <CompanyOnboardingForm
          isLegacyMigration={legacyNeedsMigration}
          onComplete={refresh}
        />
      ) : null}

      {context.requiresCustomerCpf && hasExistingCompany ? <CpfCompletionForm onComplete={refresh} /> : null}

      {hasNoCompany && !hasExistingCompany && !needsIdentity ? (
        <CompanyRequestAccessForm onRequested={refresh} />
      ) : null}

      {hasEnvelopedContent ? (
        <ProfilePanel accent>
          <ProfilePanelBody className="flex flex-col gap-8">
            {showSelector ? (
              <CompanySelector
                activeCompanyId={context.companyId}
                companies={context.availableCompanies}
                onSelected={refresh}
              />
            ) : null}

            {hasCompany ? (
              <>
                <CompanyDetailsSection context={context} onChanged={refresh} />
                <CompanyAccessRequestsSection
                  onChanged={refresh}
                  viewerRole={context.membershipRole}
                />
                <CompanyMembersSection
                  onChanged={refresh}
                  viewerRole={context.membershipRole}
                />
                <CompanyInvitationsSection
                  viewerRole={context.membershipRole}
                />
                <CompanyAuditSection role={context.membershipRole} />
              </>
            ) : null}
          </ProfilePanelBody>
        </ProfilePanel>
      ) : null}
    </div>
  );
}
