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
  | "rejected"
  | "company_selection_required"
  | "complete"
  | "incomplete";

export type OwnerApplicationStatus =
  | "document_required"
  | "pending_manual_review"
  | "auto_approved"
  | "approved"
  | "rejected";

export type OwnerApplication = {
  applicationId: number;
  companyId: number;
  attemptNumber: number;
  status: OwnerApplicationStatus;
  fileName: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  canUpload: boolean;
  canRestart: boolean;
};

/**
 * Estado retomável do onboarding, presente só quando `onboardingStatus === "incomplete"`.
 * CPF e data de nascimento ficam cifrados no WP e não voltam em claro — daí `cpfLast4`/`hasBirthDate`.
 */
export type OnboardingResumeState = {
  type?: string;
  targetCnpj?: string | null;
  cpfLast4?: string | null;
  hasBirthDate?: boolean;
  expiresAt?: string | null;
};

export type AccountSuspensionContext = {
  actorName?: string;
  actorUserId?: number;
  at?: string;
  reason?: string;
};

export type CompanyContext = {
	isB2bCohort?: boolean;
  accountStatus?: string;
  accountStatusLabel?: string;
  accountSuspension?: AccountSuspensionContext | null;
  identityStatus: string;
  companyId: number | null;
  companyStatus: string | null;
  companyRegistryStatus: string | null;
  companyOwnershipStatus: string | null;
  purchaseMode?: "b2b" | "not_buyer" | "blocked";
	requiresB2bOnboarding?: boolean;
	userContextType?: "internal_admin" | "vendor" | "customer" | "hybrid";
	isInternalAdmin?: boolean;
	isVendor?: boolean;
	hasCustomerContext?: boolean;
  isLegacyCohort?: boolean;
  legacyMigrationStatus?: string | null;
  legacyGraceEndsAt?: string | null;
  legacyWarningLevel?: "none" | "info" | "warning" | "urgent";
  legacyCanPurchaseDuringGrace?: boolean;
  membershipRole: CompanyRole | null;
  membershipStatus: MemberStatus | null;
  onboardingStatus: OnboardingStatus;
  onboarding?: OnboardingResumeState;
  ownerApplication?: OwnerApplication;
  companySelectionRequired: boolean;
  availableCompanies: AvailableCompany[];
  canPurchase: boolean;
	purchaseBlockReason?: string | null;
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
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
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
};

/** Papéis que owner/admin podem atribuir (owner só via transferência). */
export const ASSIGNABLE_ROLES: CompanyRole[] = ["admin", "buyer", "viewer"];

/** Um papel pode gerenciar members? (espelha a matriz RBAC do backend, apenas para UI.) */
export function canManageMembers(role: CompanyRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}
