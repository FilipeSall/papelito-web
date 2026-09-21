import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { WpVendorOrder } from "@/features/vendor-orders/services/vendor-order-mappers";
import { mapVendorOrderDetail } from "@/features/vendor-orders/services/vendor-order-mappers";

const { getVendorOrderDetailMock } = vi.hoisted(() => ({ getVendorOrderDetailMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/features/revendedor/server/vendor-onboarding", () => ({
  redirectIfVendorOnboardingPending: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/features/vendor-orders/server", () => ({
  getVendorOrderDetail: getVendorOrderDetailMock,
}));

import VendorOrderDetailPage from "./page";

const BRASPRESS_ORDER_ID = 21044;

function wpOrder(overrides: Partial<WpVendorOrder> = {}): WpVendorOrder {
  return {
    id: BRASPRESS_ORDER_ID,
    order_number: String(BRASPRESS_ORDER_ID),
    vendor_status: "enviado",
    shipping_service: "Rodoviário",
    next_statuses: [],
    logistics: { automatic_generation_enabled: true, status: "not_started", shipments: [] },
    ...overrides,
  };
}

async function renderPage(overrides: Partial<WpVendorOrder> = {}) {
  getVendorOrderDetailMock.mockResolvedValueOnce({
    status: "ok",
    order: mapVendorOrderDetail(wpOrder(overrides)),
  });

  render(await VendorOrderDetailPage({ params: Promise.resolve({ id: String(BRASPRESS_ORDER_ID) }) }));
}

describe("VendorOrderDetailPage por transportadora", () => {
  it("não deixa nenhuma palavra dos Correios na tela de um pedido Braspress", async () => {
    await renderPage({ shipping_provider: "braspress" });

    expect(screen.queryByText(/correios/i)).not.toBeInTheDocument();
    expect(screen.getByText("Acompanhando a Braspress")).toBeInTheDocument();
  });

  it("nomeia a transportadora ao lado do serviço contratado", async () => {
    await renderPage({ shipping_provider: "braspress" });

    expect(screen.getByText(/Braspress · Rodoviário/)).toBeInTheDocument();
  });

  it("não manda o vendor esperar uma etiqueta que a Papelito não emite pela Braspress", async () => {
    await renderPage({ shipping_provider: "braspress" });

    expect(screen.getByText("Sem postagem registrada")).toBeInTheDocument();
  });

  it("segue esperando a etiqueta no pedido dos Correios, onde a Papelito a gera", async () => {
    await renderPage({ shipping_provider: "correios" });

    expect(screen.getByText("Aguardando geração da etiqueta")).toBeInTheDocument();
    expect(screen.getByText("Acompanhando os Correios")).toBeInTheDocument();
  });

  it("não nomeia transportadora em pedido que não gravou nem provider nem serviço", async () => {
    await renderPage({ shipping_provider: "", shipping_service: "" });

    expect(screen.getByText("Serviço não informado")).toBeInTheDocument();
    expect(screen.queryByText(/correios · /i)).not.toBeInTheDocument();
  });
});
