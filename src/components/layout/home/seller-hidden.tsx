"use client";

import type { ReactNode } from "react";

import { useAuthSession } from "@/hooks/use-auth-session";

interface SellerHiddenProps {
  children: ReactNode;
}

export function SellerHidden({ children }: SellerHiddenProps) {
  const { isSeller } = useAuthSession();

  if (isSeller) {
    return null;
  }

  return <>{children}</>;
}
