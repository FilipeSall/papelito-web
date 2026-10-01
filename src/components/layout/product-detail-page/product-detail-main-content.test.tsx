import { act, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/features/cart";
import type { ProductDetailItem } from "@/features/catalog";
import { createRegionBlock } from "@/features/catalog/types/region-block";
import { buildSession } from "../../../../test/factories/session";
import { server } from "../../../../test/msw/server";
import { renderWithProviders } from "../../../../test/utils/render-with-providers";
import { ProductDetailMainContent } from "./product-detail-main-content";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
const product: ProductDetailItem = {
  id: "123", name: "Seda", category: "Sedas", type: "sedas", badge: "", description: "Resumo", longDescription: "Descrição completa",
  rating: 0, reviews: 0, price: 10, originalPrice: 10, discountPercent: 0, galleryImages: [], relatedThumbs: [],
};
const active = { vendorId: 1, storeName: "Vendor A", city: "", state: "", distanceKm: null, leadTimeDays: 1, isDefault: false };
function cart(vendorId = 2) {
  useCartStore.getState().addItem({ id: "999", name: "Outro produto", price: 10, vendorId, vendorName: "Vendor " + vendorId });
}
function renderDetail(activeVendor: typeof active | null = active) {
  return renderWithProviders(<ProductDetailMainContent product={product} activeVendor={activeVendor} selectedVendorStockQty={0} regionBlock={createRegionBlock(activeVendor ? "no_product_coverage" : "no_vendor")} showRelatedProducts={false} />, { session: buildSession() });
}

describe("compra no contexto do carrinho", () => {
  beforeEach(() => server.use(http.get("*/api/catalog/products/:productId/presentation", ({ request }) => HttpResponse.json({ product_id: 123, vendor_id: Number(new URL(request.url).searchParams.get("vendor_id")), description: "Descrição completa", summary: "Resumo", description_source: "papelito" }))));
  it("mantém a compra bloqueada até conhecer a cobertura de B, e aplica seu saldo", async () => {
    const vendors: string[] = [];
    server.use(http.get("*/api/catalog/availability", async ({ request }) => {
      vendors.push(new URL(request.url).searchParams.get("vendorId") ?? "");
      await delay(70);
      return HttpResponse.json({ status: "ok", products: { "123": { available: true, stockQty: 7 } } });
    }));
    cart();
    renderDetail();
    expect(screen.getByRole("button", { name: "COMPRAR AGORA" })).toBeDisabled();
    await waitFor(() => expect(screen.getByText("Em estoque")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "COMPRAR AGORA" })).toBeEnabled();
    expect(vendors).toEqual(["2"]);
  });

  it("saldo zero de B mantém a compra bloqueada mesmo quando a consulta retorna ok", async () => {
    server.use(http.get("*/api/catalog/availability", () => HttpResponse.json({ status: "ok", products: { "123": { available: true, stockQty: 0 } } })));
    cart();
    renderDetail();
    await screen.findByText("Sem estoque no vendor selecionado");
    expect(screen.getByRole("button", { name: "COMPRAR AGORA" })).toBeDisabled();
  });

  it("consulta B mesmo sem vendor ativo e mantém o bloqueio quando B não tem cobertura", async () => {
    server.use(http.get("*/api/catalog/availability", () => HttpResponse.json({ status: "ok", products: { "123": { available: false, stockQty: 0 } } })));
    cart();
    renderDetail(null);
    await waitFor(() => expect(screen.getByText("Nenhum vendor atende sua região com este produto.")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "COMPRAR AGORA" })).toBeDisabled();
  });

  it("falha de consulta não libera compra e resposta atrasada não libera outro vendor", async () => {
    server.use(http.get("*/api/catalog/availability", async ({ request }) => {
      if (new URL(request.url).searchParams.get("vendorId") === "2") {
        await delay(80);
        return HttpResponse.json({ status: "ok", products: { "123": { available: true, stockQty: 7 } } });
      }
      return HttpResponse.json({ status: "unavailable", products: {} });
    }));
    cart();
    renderDetail();
    act(() => useCartStore.getState().applyVendorToCart({ vendorId: 3, vendorName: "Vendor C" }));
    await waitFor(() => expect(screen.getByText(/Não foi possível verificar a disponibilidade/)).toBeInTheDocument());
    await delay(100);
    expect(screen.getByRole("button", { name: "COMPRAR AGORA" })).toBeDisabled();
  });
});
