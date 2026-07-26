"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { OnboardingSuccessToast } from "./onboarding-success-toast";

export const ONBOARDING_SUCCESS_TOAST_KEY = "papelito:onboarding-success";
const ONBOARDING_WELCOME_SHOWN_KEY = "papelito:onboarding-welcome-shown";

export function queueOnboardingSuccessToast(name: string) {
  const firstName = name.trim().split(/\s+/)[0] ?? "";

  if (!firstName) {
    return;
  }

  try {
    if (window.sessionStorage.getItem(ONBOARDING_WELCOME_SHOWN_KEY)) {
      return;
    }

    window.sessionStorage.setItem(ONBOARDING_SUCCESS_TOAST_KEY, firstName);
  } catch {
    return;
  }
}

export function OnboardingSuccessToastHost() {
  const pathname = usePathname();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
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
    }, 250);
  }, []);

  useEffect(() => {
    const storedFirstName = window.sessionStorage.getItem(ONBOARDING_SUCCESS_TOAST_KEY);

    if (!storedFirstName) {
      return;
    }

    window.sessionStorage.removeItem(ONBOARDING_SUCCESS_TOAST_KEY);
    window.sessionStorage.setItem(ONBOARDING_WELCOME_SHOWN_KEY, "1");
    enterAnimationFrameRef.current = requestAnimationFrame(() => {
      setFirstName(storedFirstName);
      setVisible(true);
    });
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 6000);

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
  }, [pathname]);

  if (!firstName) {
    return null;
  }

  return (
    <OnboardingSuccessToast firstName={firstName} onClose={handleClose} visible={visible} />
  );
}
