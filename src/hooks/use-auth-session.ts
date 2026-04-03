"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

const SESSION_STORAGE_KEY = "papelito:session";

export function useAuthSession() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session) {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          user: {
            name: session.user?.name,
            email: session.user?.email,
            image: session.user?.image,
          },
          expires: session.expires,
        }),
      );
    } else if (status === "unauthenticated") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session, status]);

  return {
    session,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}
