import { Ban } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { preAccountApplicationHref } from "@/lib/admin-pre-account-routes";
import { authOptions } from "@/lib/auth";
import {
  getAdminAnalysisSnapshot,
  parseAnalysisStatus,
} from "@/lib/server/admin-analysis";
import { getAdminAccountsOverview } from "@/lib/server/admin-accounts-overview";
import { getAdminCompaniesSnapshot } from "@/lib/server/admin-companies";
import { getAdminUserDetail, getAdminUsersSnapshot } from "@/lib/server/admin-users";
import {
  parseAdminUsersFilters,
  type AdminUsersPageSearchParams,
} from "@/lib/server/admin-users-filters";
import { firstParam } from "@/lib/search-params";

import { FOCUS_RING } from "../../primitives";
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

const COMPANY_STATUSES = new Set(["all", "active", "suspended", "onboarding", "archived"]);

function parseCompanyStatus(value: string | undefined) {
  return value && COMPANY_STATUSES.has(value) ? value : "all";
}

function SuspendedAlert({ count }: Readonly<{ count: number }>) {
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
}: Readonly<{
  searchParams?: AdminUsersPageSearchParams;
}>) {
  const legacyPreAccountApplication = firstParam(searchParams?.preAccountApplication);
  if (legacyPreAccountApplication) {
    redirect(preAccountApplicationHref(legacyPreAccountApplication, "tab=analises"));
  }

  const session = await getServerSession(authOptions);
  const activeTab = parseAccountsTab(firstParam(searchParams?.tab));
  const heading = HEADINGS[activeTab];

  const shouldOpenCreate = firstParam(searchParams?.create) === "1";
  const sourceUserId = Number.parseInt(firstParam(searchParams?.sourceUserId) ?? "", 10);

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
  };

  const [overview, people, vendors, companies, analysis, sourceUser] =
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
      shouldOpenCreate && Number.isFinite(sourceUserId) && sourceUserId > 0
        ? getAdminUserDetail(session?.accessToken, sourceUserId)
        : null,
    ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading description={heading.description} title={heading.title} />

        <VendorCreateLauncher
          hideHeading
          initialOpen={shouldOpenCreate}
          sourceUser={sourceUser}
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
    </div>
  );
}
