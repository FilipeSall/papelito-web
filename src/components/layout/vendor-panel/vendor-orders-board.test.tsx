import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  VendorOrdersFilters,
  VendorOrdersSnapshot,
  VendorOrdersSummary,
} from "@/features/vendor-orders/types/vendor-orders";

import { VendorOrdersBoard } from "./vendor-orders-board";

const pushMock = vi.fn();
const fetchMock = vi.fn();

let pathnameState = "/vendor/pedidos";
let searchState = "status=all";

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState,
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(searchState),
}));

const summary: VendorOrdersSummary = {
  all: 4,
  aguardando_pagamento: 0,
  aguardando_estoque: 0,
  aguardando_envio: 1,
  em_separacao: 1,
  enviado: 1,
  entregue: 0,
  cancelado: 1,
  fiscal_pending: 3,
};

function baseFilters(overrides: Partial<VendorOrdersFilters> = {}): VendorOrdersFilters {
  return { fiscal: "all", page: 1, search: "", status: "all", ...overrides };
}

function buildSnapshot(
  filters: Partial<VendorOrdersFilters> = {},
  overrides: Partial<VendorOrdersSnapshot> = {},
): VendorOrdersSnapshot {
  const status = filters.status ?? "all";
  const label = status === "all" ? "Todos" : status;
  const id = status === "aguardando_envio" ? 11883 : status === "entregue" ? 11884 : 11880;

  return {
    items: [
      {
        createdAt: "2026-06-12 10:00:00",
        customerName: "Filipe",
        fiscalPending: filters.fiscal === "pending",
        hasFiscalDocument: false,
        id,
        itemsCount: 2,
        itemsLabel: `${label} item`,
        nextStatuses: status === "aguardando_envio" ? ["em_separacao", "cancelado"] : [],
        orderNumber: String(id),
        status: status === "all" ? "aguardando_pagamento" : status,
        total: 100.36,
      },
    ],
    page: filters.page ?? 1,
    perPage: 20,
    summary,
    total: 1,
    totalPages: 1,
    ...overrides,
  };
}

function renderBoard(
  initialFilters: VendorOrdersFilters,
  initialSnapshot = buildSnapshot(initialFilters),
) {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <VendorOrdersBoard initialFilters={initialFilters} initialSnapshot={initialSnapshot} />
    </SWRConfig>,
  );
}

describe("VendorOrdersBoard", () => {
  beforeEach(() => {
    pathnameState = "/vendor/pedidos";
    searchState = "status=all";
    pushMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);

    const originalPushState = window.history.pushState.bind(window.history);
    vi.spyOn(window.history, "pushState").mockImplementation((data, unused, url) => {
      const nextUrl = new URL(String(url), window.location.origin);
      pathnameState = nextUrl.pathname;
      searchState = nextUrl.search.replace(/^\?/, "");
      return originalPushState(data, unused, nextUrl.toString());
    });
  });

  it("switches the queue via pushState and fetches only the list data", async () => {
    fetchMock.mockImplementation((input) =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            String(input).includes("aguardando_envio")
              ? buildSnapshot({ status: "aguardando_envio" })
              : buildSnapshot({ status: "all" }),
          ),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const user = userEvent.setup();

    renderBoard(baseFilters());

    await user.click(screen.getByRole("button", { name: /aguardando envio: 1/i }));

    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      "",
      "/vendor/pedidos?status=aguardando_envio",
    );

    expect(await screen.findByText("#11883")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/vendor/orders?status=aguardando_envio", {
      headers: { Accept: "application/json" },
      method: "GET",
    });
  });

  it("applies the fiscal queue as its own axis and resets the status", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(buildSnapshot({ fiscal: "pending" })), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const user = userEvent.setup();

    searchState = "status=enviado";
    renderBoard(baseFilters({ status: "enviado" }), buildSnapshot({ status: "enviado" }));

    await user.click(screen.getByRole("button", { name: /pagos sem nota fiscal: 3/i }));

    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      "",
      "/vendor/pedidos?status=all&fiscal=pending",
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/vendor/orders?status=all&fiscal=pending", {
        headers: { Accept: "application/json" },
        method: "GET",
      });
    });
  });

  it("reuses SWR cache when revisiting a queue and avoids the loading skeleton", async () => {
    fetchMock.mockImplementation((input) =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            String(input).includes("aguardando_envio")
              ? buildSnapshot({ status: "aguardando_envio" })
              : buildSnapshot({ status: "entregue" }),
          ),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const user = userEvent.setup();

    renderBoard(baseFilters());

    await user.click(screen.getByRole("button", { name: /aguardando envio: 1/i }));
    expect(await screen.findByText("#11883")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /entregue: 0/i }));
    expect(await screen.findByText("#11884")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /aguardando envio: 1/i }));

    expect(screen.queryByText(/carregando pedidos/i)).not.toBeInTheDocument();
    expect(screen.getByText("#11883")).toBeInTheDocument();
  });

  it("submits the search to the URL and resets the page to 1", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(buildSnapshot({ search: "filipe" })), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const user = userEvent.setup();

    searchState = "status=all&page=3";
    renderBoard(baseFilters({ page: 3 }), buildSnapshot({ page: 3 }, { totalPages: 3 }));

    await user.type(screen.getByLabelText(/busca/i), "  Filipe ");
    await user.click(screen.getByRole("button", { name: /^buscar$/i }));

    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      "",
      "/vendor/pedidos?status=all&search=Filipe",
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/vendor/orders?status=all&search=Filipe", {
        headers: { Accept: "application/json" },
        method: "GET",
      });
    });
  });

  it("keeps search and queue when paginating", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify(
          buildSnapshot({ page: 2, search: "Filipe", status: "aguardando_envio" }, { totalPages: 2 }),
        ),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const user = userEvent.setup();

    searchState = "status=aguardando_envio&search=Filipe";
    renderBoard(
      baseFilters({ search: "Filipe", status: "aguardando_envio" }),
      buildSnapshot({ search: "Filipe", status: "aguardando_envio" }, { totalPages: 2 }),
    );

    await user.click(screen.getByRole("button", { name: /próxima página/i }));

    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      "",
      "/vendor/pedidos?status=aguardando_envio&search=Filipe&page=2",
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/vendor/orders?status=aguardando_envio&search=Filipe&page=2",
        { headers: { Accept: "application/json" }, method: "GET" },
      );
    });
  });

  it("shows the empty state without dropping the queue tiles", () => {
    searchState = "status=entregue";
    renderBoard(baseFilters({ status: "entregue" }), {
      items: [],
      page: 1,
      perPage: 20,
      summary,
      total: 0,
      totalPages: 1,
    });

    expect(screen.getByText(/fila vazia/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aguardando envio: 1/i })).toBeInTheDocument();
  });
});
