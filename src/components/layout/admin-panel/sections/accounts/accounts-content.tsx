import { Ban } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  getAdminAnalysisSnapshot,
  parseAnalysisStatus,
  parseAnalysisType,
} from "@/lib/server/admin-analysis";
import { getAdminAccountsOverview } from "@/lib/server/admin-accounts-overview";
import { getAdminCompaniesSnapshot } from "@/lib/server/admin-companies";
import {
  getAdminPreAccountApplication,
  getAdminUserDetail,
  getAdminUsersSnapshot,
} from "@/lib/server/admin-users";
import {
  parseAdminUsersFilters,
  type AdminUsersPageSearchParams,
} from "@/lib/server/admin-users-filters";
import { getAdminVendorInterest } from "@/lib/server/admin-vendor-interests";
import { firstParam } from "@/lib/search-params";

import { FOCUS_RING } from "../../primitives";
import { CompanyApplicationReview } from "../company-application-review";
import { VendorCreateLauncher } from "../vendors/vendor-create-launcher";

import { ACCOUNTS_PATH, parseAccountsTab, type AccountsTab } from "./accounts-config";
import { AccountsFilterBar } from "./accounts-filter-bar";
import { AccountsSegments } from "./accounts-segments";
import { InlineAlert, SectionHeading } from "./accounts-shell";
import { AnalysisFiltersBar, AnalysisQueue } from "./analysis-queue";
import { CompaniesFilters, CompaniesList } from "./companies-list";
import { PeopleList } from "./people-list";
import { VendorsList } from "./vendors-list";

const HEADINGS: Record<AccountsTab, { description: string; title: string }> = {
  analises: {
    description:
      "Fila única de aprovação: candidaturas empresariais e manifestações de interesse em ser vendor.",
    title: "Análises",
  },
  empresas: {
    description:
      "As empresas compradoras, quem responde por elas e em que situação comercial estão. Abrir uma empresa mostra todos os seus membros.",
    title: "Empresas",
  },
  pessoas: {
    description:
      "Todas as contas da plataforma — compradores, vendors e administradores. Cada linha mostra a empresa ou a loja a que a pessoa está ligada.",
    title: "Contas",
  },
  vendors: {
    description:
      "As distribuidoras regionais: loja, praça, responsável e cobertura. Abrir leva à conta; Operação leva ao estoque e às faixas de CEP.",
    title: "Vendors",
  },
};

const COMPANY_STATUSES = ["all", "active", "suspended", "onboarding", "archived"];

function parseCompanyStatus(value: string | undefined) {
  return COMPANY_STATUSES.includes(value ?? "") ? (value as string) : "all";
}

function SuspendedAlert({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <InlineAlert icon={Ban} tone="critical">
      <span>
        {count} conta{count === 1 ? "" : "s"} suspensa{count === 1 ? "" : "s"} na plataforma.{" "}
        <Link
          className={["border-b-2 border-[#c0392b] font-black uppercase tracking-[0.12em]", FOCUS_RING].join(" ")}
          href={`${ACCOUNTS_PATH}?status=suspended`}
        >
          Ver
        </Link>
      </span>
    </InlineAlert>
  );
}

export async function AccountsContent({
  searchParams,
}: {
  searchParams?: AdminUsersPageSearchParams;
}) {
  const session = await getServerSession(authOptions);
  const activeTab = parseAccountsTab(firstParam(searchParams?.tab));
  const heading = HEADINGS[activeTab];

  const shouldOpenCreate = firstParam(searchParams?.create) === "1";
  const sourceUserId = Number.parseInt(firstParam(searchParams?.sourceUserId) ?? "", 10);
  const sourceInterestId = Number.parseInt(firstParam(searchParams?.sourceInterestId) ?? "", 10);
  const preAccountApplication = firstParam(searchParams?.preAccountApplication);

  const peopleFilters = parseAdminUsersFilters(searchParams);
  const vendorFilters = { ...peopleFilters, role: "seller" as const };
  const companyFilters = {
    companyStatus: parseCompanyStatus(firstParam(searchParams?.companyStatus)),
    page: Math.max(1, Number.parseInt(firstParam(searchParams?.page) ?? "", 10) || 1),
    perPage: 20,
    search: (firstParam(searchParams?.search) ?? "").trim(),
  };
  const analysisFilters = {
    status: parseAnalysisStatus(firstParam(searchParams?.analysisStatus)),
    type: parseAnalysisType(firstParam(searchParams?.analysisType)),
  };

  const [overview, people, vendors, companies, analysis, application, sourceUser, sourceInterest] =
    await Promise.all([
      getAdminAccountsOverview(session?.accessToken),
      activeTab === "pessoas"
        ? getAdminUsersSnapshot(session?.accessToken, peopleFilters)
        : null,
      activeTab === "vendors"
        ? getAdminUsersSnapshot(session?.accessToken, vendorFilters)
        : null,
      activeTab === "empresas"
        ? getAdminCompaniesSnapshot(session?.accessToken, companyFilters)
        : null,
      activeTab === "analises"
        ? getAdminAnalysisSnapshot(session?.accessToken, analysisFilters)
        : null,
      getAdminPreAccountApplication(session?.accessToken, preAccountApplication),
      shouldOpenCreate && Number.isFinite(sourceUserId) && sourceUserId > 0
        ? getAdminUserDetail(session?.accessToken, sourceUserId)
        : null,
      shouldOpenCreate && Number.isFinite(sourceInterestId) && sourceInterestId > 0
        ? getAdminVendorInterest(session?.accessToken, sourceInterestId)
        : null,
    ]);

  const linkedInterest =
    sourceUser && sourceInterest?.customerUserId === sourceUser.id ? sourceInterest : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading description={heading.description} title={heading.title} />

        <VendorCreateLauncher
          hideHeading
          initialOpen={shouldOpenCreate}
          sourceUser={
            sourceUser
              ? {
                  cep: sourceUser.cep,
                  city: sourceUser.city,
                  cnpj: linkedInterest?.cnpj || sourceUser.cnpj,
                  complement: sourceUser.complement,
                  email: linkedInterest?.email || sourceUser.email,
                  firstName: linkedInterest?.firstName || sourceUser.firstName,
                  id: sourceUser.id,
                  instagram: linkedInterest?.instagram || sourceUser.instagram,
                  lastName: linkedInterest?.lastName || sourceUser.lastName,
                  name: sourceUser.name,
                  neighborhood: sourceUser.neighborhood,
                  number: sourceUser.number,
                  phoneNumber: linkedInterest?.phone || sourceUser.phoneNumber,
                  state: sourceUser.state,
                  storeName: linkedInterest?.storeName || sourceUser.storeName,
                  street: sourceUser.street,
                }
              : null
          }
        />
      </div>

      <AccountsSegments
        activeTab={activeTab}
        analysisCount={analysis?.requests.length}
        counts={{
          companies: overview.companies,
          people: overview.people,
          vendors: overview.vendors,
        }}
      />

      <SuspendedAlert count={overview.suspended} />

      {activeTab === "pessoas" && people ? (
        <>
          <AccountsFilterBar filters={peopleFilters} />
          <PeopleList filters={peopleFilters} snapshot={people} />
        </>
      ) : null}

      {activeTab === "vendors" && vendors ? (
        <>
          <AccountsFilterBar filters={vendorFilters} showRole={false} />
          <VendorsList filters={vendorFilters} snapshot={vendors} />
        </>
      ) : null}

      {activeTab === "empresas" && companies ? (
        <>
          <CompaniesFilters filters={companyFilters} />
          <CompaniesList filters={companyFilters} snapshot={companies} />
        </>
      ) : null}

      {activeTab === "analises" && analysis ? (
        <>
          <AnalysisFiltersBar filters={analysisFilters} />
          <AnalysisQueue snapshot={analysis} />
        </>
      ) : null}

      {application ? (
        <CompanyApplicationReview
          apiBasePath="/api/admin/pre-account-applications"
          initialData={{ current: application, history: [application] }}
        />
      ) : null}
    </div>
  );
}
