"use client";

import { usePathname, useRouter } from "next/navigation";
import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

import { signOutAndClearSession } from "@/features/auth/client/logout";
import { AuthErrorToastHost } from "./auth-error-toast-host";
import { LegacyMigrationNotice } from "./legacy-migration-notice";
import { OnboardingSuccessToastHost } from "./onboarding-success-toast-host";

function isProtectedPath(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return (
    pathname === "/carrinho" ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/vendor")
  );
}

function InvalidSessionCleanup() {
  const pathname = usePathname();
  const router = useRouter();
  const cleanupStartedRef = useRef(false);
  const { data: session, status } = useSession();
  const hasInvalidSession =
    status === "authenticated" &&
    (typeof session?.authError === "string" ||
      typeof session?.accessToken !== "string" ||
      session.accessToken.length === 0);

  useEffect(() => {
    if (!hasInvalidSession || cleanupStartedRef.current) {
      return;
    }

    cleanupStartedRef.current = true;

    void signOutAndClearSession({ redirect: false, callbackUrl: "/" })
      .catch(() => undefined)
      .finally(() => {
        if (isProtectedPath(pathname)) {
          router.replace("/entrar");
          return;
        }

        router.refresh();
      });
  }, [hasInvalidSession, pathname, router]);

  return null;
}

// O redirecionamento de onboarding B2B vive no gate server-side de proxy.ts. Não reintroduza um
// efeito de cliente aqui: ele rodava depois do render, em todas as rotas (inclusive públicas), e
// era burlável.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <InvalidSessionCleanup />
      <AuthErrorToastHost />
      <OnboardingSuccessToastHost />
      <LegacyMigrationNotice />
      {children}
    </NextAuthSessionProvider>
  );
}
