"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const SESSION_STORAGE_KEY = "papelito:session";

type StoredSession = {
  expires?: string;
  role?: string;
  user?: {
    email?: string | null;
    image?: string | null;
    name?: string | null;
  };
};

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export function useAuthSession() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (status === "authenticated" && session) {
      try {
        const rawStoredSession = sessionStorage.getItem(SESSION_STORAGE_KEY);

        if (rawStoredSession) {
          const storedSession = JSON.parse(rawStoredSession) as StoredSession;
          const storedRole = normalizeRole(storedSession.role);
          const storedEmail = storedSession.user?.email ?? null;
          const currentEmail = session.user?.email ?? null;

          if (storedRole && storedEmail === currentEmail) {
            setRole(storedRole);
            return;
          }
        }
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }

      let cancelled = false;
      const controller = new AbortController();

      async function loadRole() {
        try {
          const response = await fetch("/api/profile/account", {
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`profile-account-${response.status}`);
          }

          const payload = (await response.json()) as { customer?: { role?: string } };

          if (!cancelled) {
            setRole(normalizeRole(payload.customer?.role) ?? "customer");
          }
        } catch (error) {
          if (
            cancelled ||
            (error instanceof DOMException && error.name === "AbortError")
          ) {
            return;
          }

          setRole("customer");
        }
      }

      void loadRole();
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    if (status === "unauthenticated") {
      setRole(undefined);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else if (status === "loading") {
      setRole(undefined);
    }
  }, [session, status]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          role,
          user: {
            name: session.user?.name,
            email: session.user?.email,
            image: session.user?.image,
          },
          expires: session.expires,
        }),
      );
    }
  }, [role, session, status]);

  return {
    session,
    status,
    role,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isRoleLoading: status === "authenticated" && role === undefined,
    isAdministrator: role === "administrator",
  };
}
