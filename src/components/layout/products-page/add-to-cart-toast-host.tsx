"use client";

import { useEffect, useRef, useState } from "react";
import { ADD_TO_CART_EVENT_NAME } from "@/components/ui/add-to-cart-button";
import { AddToCartToast } from "./add-to-cart-toast";

interface AddToCartEventDetail {
  productName?: string;
}

export function AddToCartToastHost() {
  const [toastProductName, setToastProductName] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterAnimationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    function handleAddToCart(event: Event) {
      const customEvent = event as CustomEvent<AddToCartEventDetail>;
      const productName = customEvent.detail?.productName ?? "Produto";

      setToastVisible(false);
      setToastProductName(productName);

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
        setToastProductName(null);
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

  if (!toastProductName) {
    return null;
  }

  return <AddToCartToast productName={toastProductName} visible={toastVisible} />;
}
