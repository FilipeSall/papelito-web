"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useCartStore } from "@/features/cart/store/use-cart-store";

import { VendorOptionCard, type VendorOptionCardVendor } from "./vendor-option-card";
import { VendorSwitchConfirmationModal } from "./vendor-switch-confirmation-modal";

export interface VendorPickerOption extends VendorOptionCardVendor {
  isActive: boolean;
  isNearest: boolean;
}

interface VendorPickerListProps {
  vendors: VendorPickerOption[];
  emptyMessage?: string;
}

interface PendingVendor {
  vendorId: number;
  storeName: string;
}

async function callSetActiveVendor(vendorId: number): Promise<string | null> {
  try {
    const response = await fetch("/api/profile/active-vendor", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId }),
    });

    if (response.ok) return null;

    const data = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    return data?.error?.message ?? "Não foi possível trocar de vendor.";
  } catch {
    return "Falha de rede. Tente novamente.";
  }
}

export function VendorPickerList({
  vendors,
  emptyMessage = "Nenhum vendor disponível para sua região.",
}: VendorPickerListProps) {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [pending, setPending] = useState<PendingVendor | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const cartItemCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems],
  );

  if (vendors.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-dark/20 bg-white p-8 text-center text-sm text-text-tertiary">
        {emptyMessage}
      </div>
    );
  }

  function handleSelect(vendorId: number) {
    const target = vendors.find((v) => v.vendorId === vendorId);
    if (!target || target.isActive) return;
    setErrorMessage(null);
    setPending({ vendorId: target.vendorId, storeName: target.storeName });
  }

  async function handleConfirm() {
    if (!pending) return;
    setIsSubmitting(true);
    const error = await callSetActiveVendor(pending.vendorId);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
      return;
    }

    clearCart();
    setPending(null);
    startTransition(() => router.refresh());
  }

  function handleCancel() {
    if (isSubmitting) return;
    setPending(null);
    setErrorMessage(null);
  }

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <li key={vendor.vendorId}>
            <VendorOptionCard
              vendor={vendor}
              isActive={vendor.isActive}
              isNearest={vendor.isNearest}
              onSelect={handleSelect}
              selecting={isSubmitting && pending?.vendorId === vendor.vendorId}
            />
          </li>
        ))}
      </ul>

      <VendorSwitchConfirmationModal
        open={pending !== null}
        targetVendorName={pending?.storeName ?? ""}
        cartItemCount={cartItemCount}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </>
  );
}
