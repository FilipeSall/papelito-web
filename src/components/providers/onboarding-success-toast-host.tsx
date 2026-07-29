"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { OnboardingSuccessToast } from "./onboarding-success-toast";
import { useAuthSession } from "@/hooks/use-auth-session";

const TOAST_DURATION_MS = 6000;
const EXIT_ANIMATION_MS = 250;
const CLAIM_SETTLED_KEY = "papelito:welcome-toast-settled";

type WelcomeToastClaim = {
  shown?: boolean;
  firstName?: string;
};

/**
 * Cache por aba para não repetir o claim a cada carregamento de página depois de uma negativa.
 * É só otimização: a autoridade sobre "já exibido" é a usermeta no WordPress.
 */
function readSettledMarker(accountKey: string) {
  try {
    return window.sessionStorage.getItem(`${CLAIM_SETTLED_KEY}:${accountKey}`) === "1";
  } catch {
    return false;
  }
}

function writeSettledMarker(accountKey: string) {
  try {
    window.sessionStorage.setItem(`${CLAIM_SETTLED_KEY}:${accountKey}`, "1");
  } catch {
    return;
  }
}

/**
 * Exibe o toast de conta criada uma única vez por conta, no primeiro carregamento autenticado em
 * que o e-mail já está confirmado e a conta já foi aprovada.
 *
 * O gatilho não é o cadastro: o WordPress só libera o claim quando a conta está de fato ativa, e
 * marca a exibição de forma persistente — por isso o toast não volta em refresh, logout, novo
 * login ou outro dispositivo.
 */
export function OnboardingSuccessToastHost() {
  const { isApiAuthenticated, b2b, session } = useAuthSession();
  const accountKey = session?.user?.id ?? "";
  const isApproved = b2b?.onboardingStatus === "complete";
  const [firstName, setFirstName] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const claimedAccountRef = useRef<string | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterAnimationFrameRef = useRef<number | null>(null);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    setVisible(false);
    removeTimeoutRef.current = setTimeout(() => {
      setFirstName(null);
    }, EXIT_ANIMATION_MS);
  }, []);

  useEffect(() => {
    if (!isApiAuthenticated || !isApproved || !accountKey) {
      return;
    }

    if (claimedAccountRef.current === accountKey || readSettledMarker(accountKey)) {
      return;
    }

    claimedAccountRef.current = accountKey;

    let cancelled = false;

    void (async () => {
      let claim: WelcomeToastClaim | null = null;

      try {
        const response = await fetch("/api/auth/welcome-toast", { method: "POST" });
        claim = response.ok ? ((await response.json()) as WelcomeToastClaim) : null;
      } catch {
        claim = null;
      }

      if (cancelled) {
        return;
      }

      if (claim?.shown !== true) {
        writeSettledMarker(accountKey);
        return;
      }

      writeSettledMarker(accountKey);

      const name = (claim.firstName ?? "").trim();

      enterAnimationFrameRef.current = requestAnimationFrame(() => {
        setFirstName(name);
        setVisible(true);
      });
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, TOAST_DURATION_MS);
    })();

    return () => {
      cancelled = true;
    };
  }, [accountKey, isApiAuthenticated, isApproved]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (removeTimeoutRef.current) {
        clearTimeout(removeTimeoutRef.current);
      }
      if (enterAnimationFrameRef.current) {
        cancelAnimationFrame(enterAnimationFrameRef.current);
      }
    };
  }, []);

  if (firstName === null) {
    return null;
  }

  return (
    <OnboardingSuccessToast firstName={firstName} onClose={handleClose} visible={visible} />
  );
}
