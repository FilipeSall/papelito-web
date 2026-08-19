import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Coupon, CouponListSnapshot } from "@/features/coupons/types/coupon";

import { CouponsManager } from "./coupons-manager";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function coupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    amount: 99,
    code: "vendateste",
    dateExpires: null,
    discountType: "percent",
    id: 77,
    minimumAmount: 0,
    productIds: [11798],
    role: "customer",
    status: "publish",
    usageCount: 0,
    usageLimit: 0,
    usageLimitPerUser: 0,
    vendorIds: [12],
    ...overrides,
  };
}

function list(items: Coupon[]): CouponListSnapshot {
  return { items, page: 1, perPage: 20, total: items.length };
}

function renderManager(items: Coupon[]) {
  return render(
    <CouponsManager
      initialFreeShippingMinimumCents={9900}
      initialIssues={[]}
      initialList={list(items)}
      initialPaymentConfig={null}
    />,
  );
}

async function confirmDelete(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /excluir vendateste/i }));
  await user.click(screen.getByRole("button", { name: /^remover cupom$/i }));
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("CouponsManager - remoção de cupom", () => {
  it("remove o cupom da lista quando o backend confirma", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ deleted: true, id: 77 }), { status: 200 }),
    );

    renderManager([coupon()]);
    await confirmDelete(user);

    await waitFor(() => expect(screen.getByText(/cupom removido com sucesso/i)).toBeInTheDocument());
    expect(screen.queryByText("vendateste")).toBeNull();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/coupons/77");
    expect(init.method).toBe("DELETE");
  });

  it("sincroniza a lista quando o cupom já não existe no backend", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Cupom não encontrado." }), { status: 404 }),
    );

    renderManager([coupon()]);
    await confirmDelete(user);

    await waitFor(() =>
      expect(screen.getByText(/lista de cupons atualizada/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText("vendateste")).toBeNull();
  });

  it("mostra o status quando a resposta não é o JSON da nossa rota", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response("<html>gateway timeout</html>", { status: 504 }));

    renderManager([coupon()]);
    await confirmDelete(user);

    expect(await screen.findByText(/falha ao remover cupom\. \(HTTP 504\)/i)).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("vendateste")).toBeInTheDocument();
  });

  it("preserva a mensagem de regra devolvida pelo backend", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Cupom em uso por um pedido aberto." }), {
        status: 409,
      }),
    );

    renderManager([coupon()]);
    await confirmDelete(user);

    expect(await screen.findByText(/cupom em uso por um pedido aberto/i)).toBeInTheDocument();
  });
});
