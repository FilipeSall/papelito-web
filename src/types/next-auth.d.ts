import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  type B2bContext = {
		isB2bCohort?: boolean;
    canPurchase?: boolean;
		purchaseBlockReason?: string | null;
    companyId?: number | null;
    companyOwnershipStatus?: string | null;
    companyRegistryStatus?: string | null;
    companyStatus?: string | null;
    purchaseMode?: "legacy" | "b2b" | "blocked";
    isLegacyCohort?: boolean;
    legacyMigrationStatus?: string | null;
    legacyGraceEndsAt?: string | null;
    legacyWarningLevel?: "none" | "info" | "warning" | "urgent";
    legacyCanPurchaseDuringGrace?: boolean;
    identityStatus?: string;
    membershipRole?: string | null;
    membershipStatus?: string | null;
    onboardingStatus?: string;
  };
  interface Session {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
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
