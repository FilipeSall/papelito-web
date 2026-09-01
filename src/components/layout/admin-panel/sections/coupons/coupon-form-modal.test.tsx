import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Coupon } from "@/features/coupons/types/coupon";

import { CouponFormModal } from "./coupon-form-modal";

type ProductOption = { id: number; name: string; sku: string };

const CATALOG: ProductOption[] = [
  { id: 11798, name: "Seda Alfafa King Size", sku: "PP01070001" },
  { id: 11796, name: "Seda Pink King Size", sku: "PP01070003" },
  { id: 12010, name: "Dichavador Neon", sku: "PP05010003" },
];

function coupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    amount: 10,
  freeShipping: false,
    code: "VENDATESTE",
    dateExpires: null,
    discountType: "percent",
    id: 90,
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Responde como a rota real: sem termo devolve o catálogo, com termo filtra, `ids` resolve rótulo. */
function respondFromCatalog(url: string) {
  if (url.startsWith("/api/admin/coupons/vendor-options")) {
    return json({ items: [] });
  }

  const query = new URLSearchParams(url.split("?")[1] ?? "");
  const ids = query.get("ids");

  if (ids) {
    const wanted = new Set(ids.split(",").map(Number));
    return json({ items: CATALOG.filter((product) => wanted.has(product.id)) });
  }

  const search = (query.get("search") ?? "").toLowerCase();
  const items = search
    ? CATALOG.filter((product) => product.name.toLowerCase().includes(search))
    : CATALOG;

  return json({ items });
}

function productBox() {
  return screen.getByText("Produtos permitidos").closest("div")!;
}

let fetchMock: ReturnType<typeof vi.fn>;
const onClose = vi.fn();
const onSubmit = vi.fn<(...args: unknown[]) => Promise<string | null>>();

beforeEach(() => {
  fetchMock = vi.fn((url: string) => Promise.resolve(respondFromCatalog(url)));
  vi.stubGlobal("fetch", fetchMock);
  onSubmit.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("CouponFormModal - seletor de produtos permitidos", () => {
  it("lista os produtos ao abrir, sem ninguém digitar nada", async () => {
    render(<CouponFormModal coupon={null} onClose={onClose} onSubmit={onSubmit} />);

    expect(await screen.findByText("Seda Alfafa King Size")).toBeInTheDocument();
    expect(screen.getByText("Dichavador Neon")).toBeInTheDocument();
    expect(screen.getByText("SKU PP01070001")).toBeInTheDocument();

    const called = fetchMock.mock.calls.map(([url]) => url as string);
    expect(called).toContain("/api/admin/coupons/product-options");
  });

  it("filtra por texto e volta à lista completa quando o campo é limpo", async () => {
    const user = userEvent.setup();
    render(<CouponFormModal coupon={null} onClose={onClose} onSubmit={onSubmit} />);
    await screen.findByText("Dichavador Neon");

    const field = screen.getByPlaceholderText(/buscar produto/i);
    await user.type(field, "seda");

    await waitFor(() => expect(screen.queryByText("Dichavador Neon")).toBeNull());
    expect(screen.getByText("Seda Alfafa King Size")).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock.mock.calls.map(([url]) => url as string)).toContain(
        "/api/admin/coupons/product-options?search=seda",
      ),
    );

    await user.clear(field);
    expect(await screen.findByText("Dichavador Neon")).toBeInTheDocument();
  });

  it("encontra o produto independentemente da caixa do termo", async () => {
    const user = userEvent.setup();
    render(<CouponFormModal coupon={null} onClose={onClose} onSubmit={onSubmit} />);
    await screen.findByText("Dichavador Neon");

    await user.type(screen.getByPlaceholderText(/buscar produto/i), "DICHAVADOR");

    expect(await screen.findByText("Dichavador Neon")).toBeInTheDocument();
  });

  it("diz que não encontrou quando o catálogo realmente não tem o termo", async () => {
    const user = userEvent.setup();
    render(<CouponFormModal coupon={null} onClose={onClose} onSubmit={onSubmit} />);
    await screen.findByText("Dichavador Neon");

    await user.type(screen.getByPlaceholderText(/buscar produto/i), "inexistente");

    expect(await screen.findByText("Nenhum produto encontrado.")).toBeInTheDocument();
  });

  it("mostra a mensagem da API em vez de fingir que não há produto", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.startsWith("/api/admin/coupons/product-options")
          ? json({ message: "Sessão sem access token para consultar produtos." }, 500)
          : respondFromCatalog(url),
      ),
    );

    render(<CouponFormModal coupon={null} onClose={onClose} onSubmit={onSubmit} />);

    expect(
      await screen.findByText(/sessão sem access token para consultar produtos/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Nenhum produto encontrado.")).toBeNull();
  });

  it("informa o status quando a resposta não é o JSON da nossa rota", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.startsWith("/api/admin/coupons/product-options")
          ? new Response("<html>gateway timeout</html>", { status: 504 })
          : respondFromCatalog(url),
      ),
    );

    render(<CouponFormModal coupon={null} onClose={onClose} onSubmit={onSubmit} />);

    expect(await screen.findByText(/\(HTTP 504\)/)).toBeInTheDocument();
  });

  it("mostra o erro da lista de vendors em vez de dizer que não há vendor aprovado", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.startsWith("/api/admin/coupons/vendor-options")
          ? new Response("", { status: 502 })
          : respondFromCatalog(url),
      ),
    );

    render(<CouponFormModal coupon={null} onClose={onClose} onSubmit={onSubmit} />);

    expect(await screen.findByText(/não foi possível carregar os vendors\. \(HTTP 502\)/i))
      .toBeInTheDocument();
    expect(screen.queryByText("Nenhum vendor aprovado encontrado.")).toBeNull();
  });

  it("abre um cupom existente com o nome dos produtos já vinculados", async () => {
    render(
      <CouponFormModal
        coupon={coupon({ productIds: [11798, 11796] })}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    const chips = await screen.findByRole("list");
    expect(within(chips).getByText("Seda Alfafa King Size")).toBeInTheDocument();
    expect(within(chips).getByText("Seda Pink King Size")).toBeInTheDocument();
    expect(within(chips).queryByText(/produto #/i)).toBeNull();

    await waitFor(() =>
      expect(
        within(productBox()).getByRole("checkbox", { name: /seda alfafa king size/i }),
      ).toBeChecked(),
    );
  });

  it("permite marcar e desmarcar vários produtos antes de salvar", async () => {
    const user = userEvent.setup();
    render(<CouponFormModal coupon={null} onClose={onClose} onSubmit={onSubmit} />);
    await screen.findByText("Dichavador Neon");

    const box = within(productBox());
    await user.click(box.getByRole("checkbox", { name: /seda alfafa king size/i }));
    await user.click(box.getByRole("checkbox", { name: /dichavador neon/i }));
    await user.click(box.getByRole("checkbox", { name: /dichavador neon/i }));

    await user.type(screen.getByPlaceholderText(/ex: ferias20/i), "PROMO");
    await user.click(screen.getByRole("button", { name: /criar cupom/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const [payload] = onSubmit.mock.calls[0] as [{ code: string; productIds: number[] }];
    expect(payload.code).toBe("PROMO");
    expect(payload.productIds).toEqual([11798]);
  });
});
