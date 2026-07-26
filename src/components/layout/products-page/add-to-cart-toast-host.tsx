"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADD_TO_CART_EVENT_NAME,
  type AddToCartEventDetail,
} from "@/components/ui/add-to-cart-button";
import { AddToCartToast } from "./add-to-cart-toast";

export function AddToCartToastHost() {
  const [toastDetail, setToastDetail] = useState<AddToCartEventDetail | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
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

    setToastVisible(false);
    removeTimeoutRef.current = setTimeout(() => {
      setToastDetail(null);
    }, 250);
  }, []);

  useEffect(() => {
    function handleAddToCart(event: Event) {
      const customEvent = event as CustomEvent<AddToCartEventDetail>;
      const detail = customEvent.detail ?? {};

      setToastVisible(false);
      setToastDetail(detail);

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (removeTimeoutRef.current) {
        clearTimeout(removeTimeoutRef.current);
      }
      if (enterAnimationFrameRef.current) {
        cancelAnimationFrame(enterAnimationFrameRef.current);
      }

      enterAnimationFrameRef.current = requestAnimationFrame(() => {
        setToastVisible(true);
      });

      hideTimeoutRef.current = setTimeout(() => {
        setToastVisible(false);
      }, 1800);

      removeTimeoutRef.current = setTimeout(() => {
        setToastDetail(null);
      }, 2050);
    }

    window.addEventListener(ADD_TO_CART_EVENT_NAME, handleAddToCart as EventListener);

    return () => {
      window.removeEventListener(
        ADD_TO_CART_EVENT_NAME,
        handleAddToCart as EventListener,
      );
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

  if (!toastDetail) {
    return null;
  }

  return <AddToCartToast detail={toastDetail} onClose={handleClose} visible={toastVisible} />;
}
