export type CompanyRole = "owner" | "admin" | "buyer" | "viewer";

export type MemberStatus =
  | "pending_identity"
  | "pending_company_approval"
  | "active"
  | "rejected"
  | "suspended"
  | "revoked"
  | "expired";

export type OnboardingStatus =
  | "none"
  | "pending"
  | "company_selection_required"
  | "complete"
  | "incomplete";

export type CompanyContext = {
  identityStatus: string;
  companyId: number | null;
  companyStatus: string | null;
  companyRegistryStatus: string | null;
  companyOwnershipStatus: string | null;
  membershipRole: CompanyRole | null;
  membershipStatus: MemberStatus | null;
  onboardingStatus: OnboardingStatus;
  companySelectionRequired: boolean;
  availableCompanies: AvailableCompany[];
  canPurchase: boolean;
  membershipExpiresAt?: string | null;
  company?: CompanyDetails;
};

export type CompanyDetails = {
  legalName: string;
  tradeName: string | null;
  cnpj: string;
  registryStatus: string;
  ownershipStatus: string;
  status: string;
  fiscalAddress: Record<string, string> | null;
  providerSource: string | null;
  providerCheckedAt: string | null;
  billingEmail: string | null;
  pendingBillingEmail?: string | null;
  billingEmailStatus: "unverified" | "pending" | "verified";
  phone: string | null;
};

export type CompanyAuditEvent = { action: string; createdAt: string; actor: { displayName: string; role: CompanyRole | null } | null; target: { displayName: string; role: CompanyRole | null } | null };

export type AvailableCompany = {
  companyId: number;
  legalName: string;
  tradeName: string | null;
  role: CompanyRole;
};

export type CompanyMember = {
  memberId: number;
  userId: number;
  displayName: string;
  email: string;
  role: CompanyRole;
  status: MemberStatus;
  origin: string;
  expiresAt: string | null;
};

export type CompanyInvitation = {
  invitationId: number;
  email: string;
  role: CompanyRole;
  status: "pending" | "accepted" | "revoked" | "expired";
  cpfLocked: boolean;
  expiresAt: string | null;
  resendCount: number;
  createdAt: string | null;
};

export type CompanyAccessRequest = {
  memberId: number;
  userId: number;
  displayName: string;
  email: string;
  requestedAt: string | null;
  attempts: number;
};

export type InvitationPreview = {
  invitationId: number;
  companyName: string;
  invitedRole: CompanyRole;
  invitedEmail: string;
  cpfLocked: boolean;
};

/** Papéis que owner/admin podem atribuir (owner só via transferência). */
export const ASSIGNABLE_ROLES: CompanyRole[] = ["admin", "buyer", "viewer"];

/** Um papel pode gerenciar members? (espelha a matriz RBAC do backend, apenas para UI.) */
export function canManageMembers(role: CompanyRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}
