import "server-only";

import { getAdminVendorInterests } from "@/lib/server/admin-vendor-interests";
import { wpRest } from "@/lib/server/wp-rest";

export const ANALYSIS_TYPES = ["all", "company", "vendor"] as const;

export type AnalysisType = (typeof ANALYSIS_TYPES)[number];

export const ANALYSIS_APPLICATION_STATUSES = [
  "pending_manual_review",
  "document_required",
  "approved",
  "rejected",
  "auto_approved",
] as const;

export type AnalysisApplicationStatus = (typeof ANALYSIS_APPLICATION_STATUSES)[number];

export type AnalysisFilters = {
  status: AnalysisApplicationStatus;
  type: AnalysisType;
};

export type AnalysisRequest = {
  companyLabel: string;
  createdAt: string;
  href: string;
  id: string;
  kind: "company_existing_account" | "company_pre_account" | "vendor_interest";
  kindLabel: string;
  requesterEmail: string;
  requesterName: string;
  status: string;
  statusLabel: string;
};

export type AnalysisSnapshot = {
  companyPending: number;
  issues: string[];
  requests: AnalysisRequest[];
  vendorPending: number;
};

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  approved: "Aprovada",
  auto_approved: "Aprovada automaticamente",
  document_required: "Aguardando documento",
  pending_manual_review: "Aguardando revisão",
  rejected: "Reprovada",
};

export function analysisStatusLabel(status: string) {
  return APPLICATION_STATUS_LABELS[status] ?? status ?? "—";
}

export function parseAnalysisType(value: string | undefined): AnalysisType {
  return (ANALYSIS_TYPES as readonly string[]).includes(value ?? "")
    ? (value as AnalysisType)
    : "all";
}

export function parseAnalysisStatus(value: string | undefined): AnalysisApplicationStatus {
  return (ANALYSIS_APPLICATION_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as AnalysisApplicationStatus)
    : "pending_manual_review";
}

type OwnerApplicationsResponse = {
  items?: Array<{
    applicationId: number;
    attemptNumber: number;
    companyId: number;
    companyName: string;
    createdAt: string;
    status: string;
    submittedAt: string | null;
    tradeName: string | null;
    userEmail: string;
    userId: number;
    userName: string;
  }>;
};

type PreAccountApplicationsResponse = {
  items?: Array<{
    applicationId: string;
    cnpj: string;
    companyName: string | null;
    createdAt: string;
    email: string | null;
    fullName: string | null;
    status: string;
    submittedAt: string | null;
  }>;
};

export async function getAdminAnalysisSnapshot(
  accessToken: string | undefined,
  filters: AnalysisFilters,
): Promise<AnalysisSnapshot> {
  if (!accessToken) {
    return {
      companyPending: 0,
      issues: ["Sessão sem access token para consultar as análises."],
      requests: [],
      vendorPending: 0,
    };
  }

  const headers = { Authorization: `Bearer ${accessToken}` };
  const wantsCompany = filters.type === "all" || filters.type === "company";
  const wantsVendor = filters.type === "all" || filters.type === "vendor";

  const [ownerResult, preAccountResult, interestsResult] = await Promise.all([
    wantsCompany
      ? wpRest<OwnerApplicationsResponse>(
          `/papelito/v1/admin/owner-applications?page=1&perPage=50&status=${filters.status}`,
          { headers },
        )
      : null,
    wantsCompany
      ? wpRest<PreAccountApplicationsResponse>(
          `/papelito/v1/admin/pre-account-applications?status=${filters.status}`,
          { headers },
        )
      : null,
    wantsVendor ? getAdminVendorInterests(accessToken, { page: 1, perPage: 50, search: "" }) : null,
  ]);

  const issues: string[] = [];
  const requests: AnalysisRequest[] = [];

  if (ownerResult && !ownerResult.ok) {
    issues.push(`[wp] owner-applications -> ${ownerResult.error.message}`);
  }

  if (ownerResult?.ok) {
    for (const item of ownerResult.data.items ?? []) {
      requests.push({
        companyLabel: item.tradeName || item.companyName || `Empresa #${item.companyId}`,
        createdAt: item.submittedAt ?? item.createdAt,
        href: `/admin/contas/${item.userId}?tab=company-review`,
        id: `owner-${item.applicationId}`,
        kind: "company_existing_account",
        kindLabel: `Empresa · tentativa ${item.attemptNumber}`,
        requesterEmail: item.userEmail,
        requesterName: item.userName,
        status: item.status,
        statusLabel: analysisStatusLabel(item.status),
      });
    }
  }

  if (preAccountResult && !preAccountResult.ok) {
    issues.push(`[wp] pre-account-applications -> ${preAccountResult.error.message}`);
  }

  if (preAccountResult?.ok) {
    for (const item of preAccountResult.data.items ?? []) {
      requests.push({
        companyLabel: item.companyName || item.cnpj,
        createdAt: item.submittedAt ?? item.createdAt,
        href: `/admin/contas?preAccountApplication=${encodeURIComponent(item.applicationId)}`,
        id: `pre-${item.applicationId}`,
        kind: "company_pre_account",
        kindLabel: "Empresa · pré-conta",
        requesterEmail: item.email || "—",
        requesterName: item.fullName || "Responsável não informado",
        status: item.status,
        statusLabel: analysisStatusLabel(item.status),
      });
    }
  }

  if (interestsResult?.issue) {
    issues.push(`[wp] vendor-interests -> ${interestsResult.issue}`);
  }

  if (interestsResult) {
    for (const item of interestsResult.items) {
      requests.push({
        companyLabel: item.storeName || `Manifestação #${item.id}`,
        createdAt: item.createdAt,
        href: `/admin/vendors/interesses/${item.id}`,
        id: `interest-${item.id}`,
        kind: "vendor_interest",
        kindLabel: item.customerUserId ? "Vendor · com conta" : "Vendor · sem conta",
        requesterEmail: item.email || "—",
        requesterName: [item.firstName, item.lastName].filter(Boolean).join(" ") || "—",
        status: "pending_manual_review",
        statusLabel: "Aguardando contato",
      });
    }
  }

  requests.sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return {
    companyPending: requests.filter((request) => request.kind !== "vendor_interest").length,
    issues,
    requests,
    vendorPending: requests.filter((request) => request.kind === "vendor_interest").length,
  };
}
