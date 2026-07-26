"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ProfileCustomer } from "@/features/profile/types/profile-customer";
import { resolveCustomerCep } from "@/features/profile/utils/resolve-customer-cep";
import { useAuthSession } from "@/hooks/use-auth-session";

import { MissingCepModal } from "./missing-cep-modal";

const STORAGE_KEY_PREFIX = "papelito:missing-cep-modal:dismissed:";

type ProfileAccountResponse = {
  customer?: Pick<ProfileCustomer, "billing" | "meta" | "shipping">;
};

function resolveAccountKey(session: ReturnType<typeof useAuthSession>["session"]) {
  const userId = session?.user?.id;
  if (typeof userId === "string" && userId.trim().length > 0) {
    return userId.trim();
  }

  const userEmail = session?.user?.email;
  if (typeof userEmail === "string" && userEmail.trim().length > 0) {
    return userEmail.trim().toLowerCase();
  }

  return null;
}

export function MissingCepModalHost() {
  const router = useRouter();
  const { role, session, status } = useAuthSession();
  const [visibleAccountKey, setVisibleAccountKey] = useState<string | null>(null);
  const checkedAccountKeysRef = useRef(new Set<string>());
  const accountKey = useMemo(() => resolveAccountKey(session), [session]);
  // Durante o onboarding B2B o CEP é campo do formulário em /cadastro/completar; abrir o modal
  // isolado por cima duplicaria a pergunta.
  const isOnboardingIncomplete = session?.b2b?.onboardingStatus === "incomplete";
  const isEligibleAccount =
    status === "authenticated" && role === "customer" && Boolean(accountKey) && !isOnboardingIncomplete;

  useEffect(() => {
    if (!isEligibleAccount || !accountKey || typeof window === "undefined") {
      return;
    }

    const dismissedKey = `${STORAGE_KEY_PREFIX}${accountKey}`;

    if (window.sessionStorage.getItem(dismissedKey) === "1") {
      return;
    }

    if (checkedAccountKeysRef.current.has(accountKey)) {
      return;
    }

    checkedAccountKeysRef.current.add(accountKey);

    const abortController = new AbortController();

    void (async () => {
      try {
        const response = await fetch("/api/profile/account", {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ProfileAccountResponse;
        const cep = resolveCustomerCep(payload.customer);

        if (!cep && window.sessionStorage.getItem(dismissedKey) !== "1") {
          setVisibleAccountKey(accountKey);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [accountKey, isEligibleAccount]);

  function dismissModal() {
    if (!accountKey || typeof window === "undefined") {
      setVisibleAccountKey(null);
      return;
    }

    window.sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${accountKey}`, "1");
    setVisibleAccountKey(null);
  }

  function handleRegisterCep() {
    dismissModal();
    router.push("/perfil/enderecos?openEditor=1");
  }

  return (
    <MissingCepModal
      onClose={dismissModal}
      onConfirm={handleRegisterCep}
      open={isEligibleAccount && visibleAccountKey === accountKey}
    />
  );
}
