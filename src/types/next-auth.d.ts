import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    profileComplete?: boolean;
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
    profileComplete?: boolean;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    profileComplete?: boolean;
    role?: string;
  }
}
