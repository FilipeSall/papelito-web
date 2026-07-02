"use client";

import { useEffect, useRef, useState } from "react";

import { useAuthSession } from "@/hooks/use-auth-session";
import { AuthErrorToast } from "./auth-error-toast";

export function AuthErrorToastHost() {
  const { authIdentityError } = useAuthSession();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterAnimationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!authIdentityError) {
      return;
    }

    enterAnimationFrameRef.current = requestAnimationFrame(() => {
      setMounted(true);
      setVisible(true);
    });

    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 5000);

    removeTimeoutRef.current = setTimeout(() => {
      setMounted(false);
    }, 5250);

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
  }, [authIdentityError]);

  if (!mounted) {
    return null;
  }

  return <AuthErrorToast visible={visible} />;
}
