import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  type B2bContext = {
		isB2bCohort?: boolean;
    canPurchase?: boolean;
		purchaseBlockReason?: string | null;
		purchaseMode?: "b2b" | "not_buyer" | "blocked";
		requiresB2bOnboarding?: boolean;
		userContextType?: "internal_admin" | "vendor" | "customer" | "hybrid";
		isInternalAdmin?: boolean;
		isVendor?: boolean;
		hasCustomerContext?: boolean;
    companyId?: number | null;
    companyOwnershipStatus?: string | null;
    companyRegistryStatus?: string | null;
    companyStatus?: string | null;
    isLegacyCohort?: boolean;
    legacyMigrationStatus?: string | null;
    legacyGraceEndsAt?: string | null;
    legacyWarningLevel?: "none" | "info" | "warning" | "urgent";
    legacyCanPurchaseDuringGrace?: boolean;
    identityStatus?: string;
    membershipRole?: string | null;
    membershipStatus?: string | null;
    onboardingStatus?: string;
    ownerApplication?: {
      applicationId: number;
      companyId: number;
      attemptNumber: number;
      status:
        | "document_required"
        | "pending_manual_review"
        | "auto_approved"
        | "approved"
        | "rejected";
      fileName: string | null;
      submittedAt: string | null;
      decidedAt: string | null;
      canUpload: boolean;
      canRestart: boolean;
    };
    /** Estado retomável, presente só quando onboardingStatus === "incomplete". Sem PII em claro. */
    onboarding?: {
      type?: string;
      targetCnpj?: string | null;
      cpfLast4?: string | null;
      hasBirthDate?: boolean;
      expiresAt?: string | null;
    };
  };
  interface Session {
    accessToken?: string;
    accessTokenExpires?: number;
    authError?: string;
    authIdentityError?: boolean;
    profileComplete?: boolean;
    b2b?: B2bContext;
    role?: string;
    user?: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    authError?: string;
    profileComplete?: boolean;
    b2b?: B2bContext;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    authError?: string;
    authIdentityError?: boolean;
    profileComplete?: boolean;
    b2b?: B2bContext;
    role?: string;
    roleCheckedAt?: number;
  }
}
