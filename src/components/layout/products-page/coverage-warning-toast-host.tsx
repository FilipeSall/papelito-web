"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CoverageWarningToast } from "./coverage-warning-toast";

const SESSION_FLAG_KEY = "papelito:coverage-warning-shown";

interface CoverageWarningToastHostProps {
  shouldShow: boolean;
}

export function CoverageWarningToastHost({
  shouldShow,
}: CoverageWarningToastHostProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterAnimationFrameRef = useRef<number | null>(null);

  const handleClose = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (removeTimeoutRef.current) {
      clearTimeout(removeTimeoutRef.current);
    }

    setVisible(false);
    removeTimeoutRef.current = setTimeout(() => {
      setMounted(false);
    }, 250);
  }, []);

  useEffect(() => {
    if (!shouldShow) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    if (window.sessionStorage.getItem(SESSION_FLAG_KEY) === "1") {
      return;
    }

    window.sessionStorage.setItem(SESSION_FLAG_KEY, "1");

    enterAnimationFrameRef.current = requestAnimationFrame(() => {
      setMounted(true);
      setVisible(true);
    });

    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 4000);

    removeTimeoutRef.current = setTimeout(() => {
      setMounted(false);
    }, 4250);

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
  }, [shouldShow]);

  if (!mounted) {
    return null;
  }

  return <CoverageWarningToast onClose={handleClose} visible={visible} />;
}
