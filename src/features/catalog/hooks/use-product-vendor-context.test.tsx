import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCartStore } from "@/features/cart";
import { useProductVendorContext } from "./use-product-vendor-context";

const active = { vendorId: 1, storeName: "Vendor A", city: "", state: "", distanceKm: null, leadTimeDays: 1, isDefault: false };

describe("contexto de vendor no detalhe", () => {
  it("carrinho prevalece e a resolução de compra atualiza o contexto", () => {
    const { result } = renderHook(() => useProductVendorContext(active, true));
    expect(result.current.vendorId).toBe(1);
    act(() => useCartStore.getState().addItem({ id: "123", name: "Seda", price: 10, vendorId: 2, vendorName: "Vendor B" }));
    expect(result.current.vendorId).toBe(2);
    expect(result.current.vendorName).toBe("Vendor B");
    expect(result.current.fromCart).toBe(true);
    act(() => useCartStore.getState().applyVendorToCart({ vendorId: 3, vendorName: "Vendor C" }));
    expect(result.current.vendorId).toBe(3);
    act(() => useCartStore.getState().clearCart());
    expect(result.current.vendorId).toBe(1);
  });

  it("visitante ou seller não herda carrinho de sessão anterior", () => {
    act(() => useCartStore.getState().addItem({ id: "123", name: "Seda", price: 10, vendorId: 2, vendorName: "Vendor B" }));
    const { result } = renderHook(() => useProductVendorContext(active, false));
    expect(result.current.vendorId).toBeNull();
  });
});
