import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Coupon, CouponListSnapshot } from "@/features/coupons/types/coupon";

import { CouponsPanel } from "./coupons-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const DAY_MS = 24 * 60 * 60 * 1000;

function coupon(overrides: Partial<Coupon> & { code: string; id: number }): Coupon {
  return {
    amount: 20,
    dateExpires: null,
    discountType: "percent",
    freeShipping: false,
    minimumAmount: 0,
    productIds: [],
    role: "customer",
    status: "publish",
    usageCount: 0,
    usageLimit: 0,
    usageLimitPerUser: 0,
    vendorIds: [],
    ...overrides,
  };
}

function snapshot(items: Coupon[]): CouponListSnapshot {
  return { items, page: 1, perPage: 20, total: items.length };
}

const FILTERS = { page: 1, search: "", status: "any" as const };

/** O nome acessível vive no botão que cobre a linha; a linha em si é só o contêiner. */
function rowFor(code: string) {
  const trigger = screen.getByRole("button", { name: new RegExp(`editar cupom ${code}`, "i") });
  const row = trigger.closest("li");

  if (!row) {
    throw new Error(`Linha do cupom ${code} não encontrada.`);
  }

  return within(row);
}

describe("CouponsPanel", () => {
  it("distingue os quatro estados por ícone mais texto", () => {
    render(
      <CouponsPanel
        filters={FILTERS}
        issues={[]}
        list={snapshot([
          coupon({ code: "ATIVO", id: 1 }),
          coupon({ code: "RASCUNHO", id: 2, status: "draft" }),
          coupon({
            code: "EXPIRADO",
            dateExpires: new Date(Date.now() - DAY_MS).toISOString(),
            id: 3,
          }),
          coupon({ code: "ESGOTADO", id: 4, usageCount: 50, usageLimit: 50 }),
        ])}
      />,
    );

    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Rascunho")).toBeInTheDocument();
    expect(screen.getByText("Expirado")).toBeInTheDocument();
    expect(screen.getByText("Esgotado")).toBeInTheDocument();
  });

  it("mantém rascunho vencido como rascunho", () => {
    render(
      <CouponsPanel
        filters={FILTERS}
        issues={[]}
        list={snapshot([
          coupon({
            code: "ANTIGO",
            dateExpires: new Date(Date.now() - DAY_MS).toISOString(),
            id: 9,
            status: "draft",
          }),
        ])}
      />,
    );

    expect(screen.getByText("Rascunho")).toBeInTheDocument();
    expect(screen.queryByText("Expirado")).not.toBeInTheDocument();
  });

  it("diz o alcance do cupom e o uso em relação ao limite", () => {
    render(
      <CouponsPanel
        filters={FILTERS}
        issues={[]}
        list={snapshot([
          coupon({ code: "GERAL", id: 1, usageCount: 3 }),
          coupon({ code: "RESTRITO", id: 2, productIds: [7], usageLimit: 10, vendorIds: [4, 5] }),
        ])}
      />,
    );

    expect(rowFor("GERAL").getByText(/vale para todo o catálogo/i)).toBeInTheDocument();
    expect(rowFor("GERAL").getByText("3 usos · sem limite")).toBeInTheDocument();
    expect(
      rowFor("RESTRITO").getByText(/vale só para 2 vendors e 1 produto/i),
    ).toBeInTheDocument();
    expect(rowFor("RESTRITO").getByText("0 / 10 usos")).toBeInTheDocument();
  });

  it("mostra o estado vazio do recorte quando há filtro aplicado", () => {
    render(
      <CouponsPanel
        filters={{ page: 1, search: "ferias", status: "publish" }}
        issues={[]}
        list={snapshot([])}
      />,
    );

    expect(screen.getByText(/nada neste recorte/i)).toBeInTheDocument();
  });

  it("mostra o estado vazio de catálogo quando não há filtro", () => {
    render(<CouponsPanel filters={FILTERS} issues={[]} list={snapshot([])} />);

    expect(screen.getByText(/nenhum cupom cadastrado/i)).toBeInTheDocument();
  });

  it("não pagina com uma página só", () => {
    render(<CouponsPanel filters={FILTERS} issues={[]} list={snapshot([coupon({ code: "A", id: 1 })])} />);

    expect(screen.queryByRole("navigation", { name: /paginação/i })).not.toBeInTheDocument();
  });

  it("pagina quando o total passa do tamanho da página", () => {
    render(
      <CouponsPanel
        filters={FILTERS}
        issues={[]}
        list={{ items: [coupon({ code: "A", id: 1 })], page: 1, perPage: 20, total: 42 }}
      />,
    );

    expect(screen.getByRole("navigation", { name: /paginação/i })).toBeInTheDocument();
    expect(screen.getByText(/página 1 de 3/i)).toBeInTheDocument();
  });

  it("repassa o problema que o servidor reportou", () => {
    render(
      <CouponsPanel
        filters={FILTERS}
        issues={["Sessão sem access token para consultar cupons."]}
        list={snapshot([])}
      />,
    );

    expect(screen.getByText(/sessão sem access token/i)).toBeInTheDocument();
  });
});
