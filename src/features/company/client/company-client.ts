"use client";

import type {
  CompanyAccessRequest,
  CompanyAuditEvent,
  CompanyContext,
  CompanyInvitation,
  CompanyMember,
  CompanyRole,
  InvitationPreview,
  OwnerApplication,
} from "../types/company";
import { DirectUploadError, uploadDirectFile } from "@/lib/client/direct-upload";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code?: string; message: string };

async function call<T>(
  path: string,
  init: RequestInit & { idempotent?: boolean } = {},
): Promise<ApiResult<T>> {
  const { idempotent, headers, ...rest } = init;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  // Mutações levam Idempotency-Key durável, seguro contra duplo-clique/retry.
  if (idempotent && !finalHeaders["Idempotency-Key"]) {
    finalHeaders["Idempotency-Key"] = crypto.randomUUID();
  }

  let response: Response;
  try {
    response = await fetch(path, { ...rest, headers: finalHeaders });
  } catch {
    return { ok: false, status: 0, message: "Falha de rede. Tente novamente." };
  }

  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const message =
      (body as { message?: string } | null)?.message ??
      "Não foi possível concluir a operação.";
    return {
      ok: false,
      status: response.status,
      code: (body as { code?: string } | null)?.code,
      message,
    };
  }

  return { ok: true, data: body as T };
}

function idempotencyKey() {
  return crypto.randomUUID();
}

export function fetchCompanyContext() {
  return call<CompanyContext>("/api/company/current");
}

export function saveCustomerProfile(payload: {
  cpf: string;
  birth_date: string;
  cep: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}) {
  return call<CompanyContext>("/api/company/onboarding/customer-profile", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function saveCustomerCpf(cpf: string) {
  return call<CompanyContext>("/api/company/identity/cpf", {
    method: "POST",
    idempotent: true,
    body: JSON.stringify({ cpf }),
  });
}

export function createCompany(payload: {
  cpf: string;
  birth_date: string;
  cnpj: string;
  full_name?: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}) {
  return call<CompanyContext>("/api/company", {
    method: "POST",
    idempotent: true,
    body: JSON.stringify(payload),
  });
}

export async function uploadOwnerDocument(file: File): Promise<ApiResult<{
  application: OwnerApplication;
  context: CompanyContext;
}>> {
  try {
    const data = await uploadDirectFile<{
      application: OwnerApplication;
      context: CompanyContext;
    }>("owner-document", file);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof DirectUploadError) {
      return { ok: false, status: error.status, message: error.message };
    }

    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "Não foi possível enviar o documento.",
    };
  }
}

export function restartOwnerOnboarding() {
  return call<CompanyContext>("/api/company/current/restart-onboarding", {
    method: "POST",
  });
}

export function selectActiveCompany(companyId: number) {
  return call<CompanyContext>("/api/company/current/select", {
    method: "POST",
    body: JSON.stringify({ companyId }),
  });
}

export function requestCompanyAccess(cnpj: string) {
  return call<{ status: string }>("/api/company/request-access", {
    method: "POST",
    idempotent: true,
    body: JSON.stringify({ cnpj }),
  });
}

export function startLegacyMigration(payload: {
  intent: "create_company" | "join_company";
  cpf: string;
  birthDate: string;
  cnpj: string;
}) {
  return call<CompanyContext>("/api/legacy-migration/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listMembers() {
  return call<{ items: CompanyMember[] }>("/api/company/current/members");
}

export function patchMember(
  memberId: number,
  payload: { role?: CompanyRole; status?: "suspend" | "revoke" | "reactivate"; expiresAt?: string | null },
) {
  return call<{ ok: true; replayed: boolean }>(`/api/company/current/members/${memberId}`, {
    method: "PATCH",
    idempotent: true,
    body: JSON.stringify(payload),
  });
}

export function updateCompanyDetails(payload: { billingEmail?: string; phone?: string }, key = idempotencyKey()) {
  return call<CompanyContext>("/api/company/current", { method: "PATCH", idempotent: true, headers: { "Idempotency-Key": key }, body: JSON.stringify(payload) });
}

export function listCompanyAudit(page = 1) {
  return call<{ items: CompanyAuditEvent[]; page: number; perPage: number }>(`/api/company/current/audit?page=${page}`);
}

export function resendBillingEmailConfirmation(key = idempotencyKey()) {
  return call<CompanyContext>("/api/company/current/billing-email/resend", {
    method: "POST",
    idempotent: true,
    headers: { "Idempotency-Key": key },
  });
}

export function removeMember(memberId: number) {
  return call<{ ok: true }>(`/api/company/current/members/${memberId}`, {
    method: "DELETE",
    idempotent: true,
  });
}

export function listInvitations() {
  return call<{ items: CompanyInvitation[] }>("/api/company/current/invitations");
}

export function createInvitation(payload: {
  invited_email: string;
  invited_role: CompanyRole;
}) {
  return call<{ invitationId: number }>("/api/company/current/invitations", {
    method: "POST",
    idempotent: true,
    body: JSON.stringify(payload),
  });
}

export function resendInvitation(invitationId: number) {
  return call<{ ok: true }>(`/api/company/current/invitations/${invitationId}/resend`, {
    method: "POST",
    idempotent: true,
  });
}

export function revokeInvitation(invitationId: number, reason = "") {
  return call<{ ok: true }>(`/api/company/current/invitations/${invitationId}`, {
    method: "DELETE",
    idempotent: true,
    body: JSON.stringify({ reason }),
  });
}

export function listAccessRequests() {
  return call<{ items: CompanyAccessRequest[] }>("/api/company/current/access-requests");
}

export function approveAccessRequest(memberId: number, role: CompanyRole = "buyer") {
  return call<{ ok: true }>(`/api/company/current/access-requests/${memberId}/approve`, {
    method: "POST",
    idempotent: true,
    body: JSON.stringify({ role }),
  });
}

export function rejectAccessRequest(memberId: number, reason: string) {
  return call<{ ok: true }>(`/api/company/current/access-requests/${memberId}/reject`, {
    method: "POST",
    idempotent: true,
    body: JSON.stringify({ reason }),
  });
}

export function transferOwnership(targetUserId: number) {
  return call<{ ok: true }>("/api/company/current/transfer-ownership", {
    method: "POST",
    idempotent: true,
    body: JSON.stringify({ targetUserId }),
  });
}

export function previewInvitation(token: string) {
  return call<InvitationPreview>(`/api/company/invitations/${encodeURIComponent(token)}`);
}

export function acceptInvitation() {
  return call<CompanyContext>("/api/company/invitations/accept", {
    method: "POST",
  });
}

export function declineInvitation() {
  return call<{ ok: true }>("/api/company/invitations/decline", { method: "POST" });
}
