"use client";

import { usePathname, useRouter } from "next/navigation";
import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

import { signOutAndClearSession } from "@/features/auth/client/logout";
import { AuthErrorToastHost } from "./auth-error-toast-host";

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

function B2bOnboardingRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || pathname.startsWith("/perfil/empresa")) return;
    if (session?.b2b?.onboardingStatus === "incomplete" || session?.profileComplete === false) {
      router.replace("/perfil/empresa");
    }
  }, [pathname, router, session?.b2b?.onboardingStatus, session?.profileComplete, status]);

  return null;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <InvalidSessionCleanup />
      <B2bOnboardingRedirect />
      <AuthErrorToastHost />
      {children}
    </NextAuthSessionProvider>
  );
}
