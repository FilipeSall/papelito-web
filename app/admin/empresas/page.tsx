import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";
import { firstParam } from "@/lib/search-params";

type ApplicationStatus =
  | "pending_manual_review"
  | "document_required"
  | "approved"
  | "rejected"
  | "auto_approved";

type ApplicationsResponse = {
  items: Array<{
    applicationId: number;
    companyId: number;
    userId: number;
    attemptNumber: number;
    status: ApplicationStatus;
    submittedAt: string | null;
    createdAt: string;
    companyName: string;
    tradeName: string | null;
    userName: string;
    userEmail: string;
  }>;
  total: number;
};

type PreAccountApplicationsResponse = {
  items: Array<{
    applicationId: string;
    email: string | null;
    fullName: string | null;
    companyName: string | null;
    cnpj: string;
    status: Exclude<ApplicationStatus, "auto_approved">;
    submittedAt: string | null;
    createdAt: string;
  }>;
};

const FILTERS: Array<{ status: ApplicationStatus; label: string }> = [
  { status: "pending_manual_review", label: "Aguardando revisão" },
  { status: "document_required", label: "Aguardando documento" },
  { status: "approved", label: "Aprovadas" },
  { status: "rejected", label: "Reprovadas" },
  { status: "auto_approved", label: "Automáticas" },
];

function parseStatus(value: string | undefined): ApplicationStatus {
  return FILTERS.some((filter) => filter.status === value)
    ? (value as ApplicationStatus)
    : "pending_manual_review";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(date);
}

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const status = parseStatus(firstParam(params.status));
  const session = await getServerSession(authOptions);
  const headers = { Authorization: `Bearer ${session?.accessToken ?? ""}` };
  const [ownerResult, preAccountResult] = await Promise.all([
    wpRest<ApplicationsResponse>(
      `/papelito/v1/admin/owner-applications?page=1&perPage=50&status=${status}`,
      { headers },
    ),
    wpRest<PreAccountApplicationsResponse>(
      `/papelito/v1/admin/pre-account-applications?status=${status}`,
      { headers },
    ),
  ]);
  const applications = [
    ...(ownerResult.ok
      ? ownerResult.data.items.map((application) => ({
          ...application,
          source: "existing_account" as const,
          href: `/admin/users/${application.userId}?tab=company-review`,
          companyIdentifier: application.tradeName || `#${application.companyId}`,
        }))
      : []),
    ...(preAccountResult.ok
      ? preAccountResult.data.items.map((application) => ({
          applicationId: application.applicationId,
          companyName: application.companyName || "Empresa em análise",
          companyIdentifier: application.cnpj,
          createdAt: application.createdAt,
          fullName: application.fullName || "Responsável não disponível",
          href: `/admin/empresas/${encodeURIComponent(application.applicationId)}`,
          source: "pre_account" as const,
          submittedAt: application.submittedAt,
          userEmail: application.email || "—",
        }))
      : []),
  ];
  const total = applications.length;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-text-tertiary">B2B</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black uppercase">Análises empresariais</h1>
          <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#1a1a1a] px-2 text-xs font-black text-brand-yellow">
            {total}
          </span>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Filtrar candidaturas">
        {FILTERS.map((filter) => (
          <Link
            key={filter.status}
            href={`/admin/empresas?status=${filter.status}`}
            className={[
              "border-2 border-[#1a1a1a] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]",
              status === filter.status
                ? "bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]"
                : "bg-white text-[#1a1a1a] hover:bg-brand-yellow",
            ].join(" ")}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto border-2 border-[#1a1a1a] bg-white shadow-[8px_8px_0px_#1a1a1a]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-[#1a1a1a] bg-brand-yellow text-[10px] uppercase tracking-[0.16em]">
              <th className="p-3">Empresa</th>
              <th className="p-3">Responsável</th>
              <th className="p-3">Origem</th>
              <th className="p-3">Recebida</th>
              <th className="p-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.applicationId} className="border-b border-[#1a1a1a]/14">
                <td className="p-3">
                  <p className="font-bold">{application.companyName}</p>
                  <p className="text-xs text-[#1a1a1a]/55">{application.companyIdentifier}</p>
                </td>
                <td className="p-3">
                  <p>{"fullName" in application ? application.fullName : application.userName}</p>
                  <p className="text-xs text-[#1a1a1a]/55">{application.userEmail}</p>
                </td>
                <td className="p-3">
                  {application.source === "pre_account" ? "Pré-conta" : `Tentativa #${application.attemptNumber}`}
                </td>
                <td className="p-3">{formatDate(application.submittedAt ?? application.createdAt)}</td>
                <td className="p-3">
                  <Link
                    href={application.href}
                    className="inline-flex border-2 border-[#1a1a1a] bg-white px-3 py-2 text-[10px] font-black uppercase hover:bg-brand-yellow"
                  >
                    Abrir análise
                  </Link>
                </td>
              </tr>
            ))}
            {applications.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-[#1a1a1a]/58" colSpan={5}>
                  Nenhuma candidatura neste filtro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
