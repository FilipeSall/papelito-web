"use client";

import { useEffect, useRef, useState } from "react";
import type { AddToCartEventDetail } from "@/components/ui/add-to-cart-button";

type TimeoutRef = { current: ReturnType<typeof setTimeout> | null };
type FrameRef = { current: number | null };
type ShareOutcome = "shared" | "aborted" | "unsupported";

const TOAST_TITLE = "Compartilhar produto";
const TOAST_HIDE_DELAY_MS = 1800;
const TOAST_REMOVE_DELAY_MS = 2050;
const TOAST_DISMISS_DELAY_MS = 250;

function clearTimeoutRef(ref: TimeoutRef) {
  if (ref.current) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}

function cancelFrameRef(ref: FrameRef) {
  if (ref.current) {
    cancelAnimationFrame(ref.current);
    ref.current = null;
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function shareViaNavigator(shareData: ShareData): Promise<ShareOutcome> {
  if (typeof navigator.share !== "function") {
    return "unsupported";
  }

  try {
    await navigator.share(shareData);
    return "shared";
  } catch (error) {
    return isAbortError(error) ? "aborted" : "unsupported";
  }
}

export function useProductShare(productName: string) {
  const [shareToast, setShareToast] = useState<AddToCartEventDetail | null>(null);
  const [shareToastVisible, setShareToastVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      clearTimeoutRef(hideTimeoutRef);
      clearTimeoutRef(removeTimeoutRef);
      cancelFrameRef(enterFrameRef);
    };
  }, []);

  function showShareToast(detail: AddToCartEventDetail) {
    setShareToastVisible(false);
    setShareToast(detail);

    clearTimeoutRef(hideTimeoutRef);
    clearTimeoutRef(removeTimeoutRef);
    cancelFrameRef(enterFrameRef);

    enterFrameRef.current = requestAnimationFrame(() => {
      setShareToastVisible(true);
    });

    hideTimeoutRef.current = setTimeout(() => {
      setShareToastVisible(false);
    }, TOAST_HIDE_DELAY_MS);

    removeTimeoutRef.current = setTimeout(() => {
      setShareToast(null);
    }, TOAST_REMOVE_DELAY_MS);
  }

  function dismissShareToast() {
    clearTimeoutRef(hideTimeoutRef);
    clearTimeoutRef(removeTimeoutRef);

    setShareToastVisible(false);
    removeTimeoutRef.current = setTimeout(() => {
      setShareToast(null);
    }, TOAST_DISMISS_DELAY_MS);
  }

  async function shareProduct() {
    const productUrl = window.location.href;
    const outcome = await shareViaNavigator({
      title: productName,
      text: `Confira este produto da Papelito: ${productName}`,
      url: productUrl,
    });

    if (outcome === "aborted") {
      return;
    }

    if (outcome === "shared") {
      showShareToast({ title: TOAST_TITLE, message: "Link compartilhado.", tone: "success" });
      return;
    }

    try {
      await navigator.clipboard.writeText(productUrl);
      showShareToast({ title: TOAST_TITLE, message: "Link copiado.", tone: "success" });
    } catch {
      showShareToast({
        title: TOAST_TITLE,
        message: "Não foi possível compartilhar.",
        tone: "error",
      });
    }
  }

  return {
    shareToast,
    shareToastVisible,
    dismissShareToast,
    shareProduct: () => {
      void shareProduct();
    },
  };
}
