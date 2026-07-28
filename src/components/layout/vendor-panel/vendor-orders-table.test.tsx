import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VendorOrdersFilters, VendorOrdersSnapshot } from "@/features/vendor-orders/types/vendor-orders";

import { VendorOrdersTable } from "./vendor-orders-table";

const pushMock = vi.fn();
const fetchMock = vi.fn();

let pathnameState = "/vendor/pedidos";
let searchState = "status=all";

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState,
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(searchState),
}));

function buildSnapshot(
  filters: Partial<VendorOrdersFilters> = {},
  overrides: Partial<VendorOrdersSnapshot> = {},
): VendorOrdersSnapshot {
  const status = filters.status ?? "all";
  const label = status === "all" ? "Todos" : status;

  return {
    items: [
      {
        createdAt: "2026-06-12 10:00:00",
        customerName: "Filipe",
        id: status === "aguardando_envio" ? 11883 : status === "entregue" ? 11884 : 11880,
        itemsCount: 2,
        itemsLabel: `${label} item`,
        orderNumber: status === "aguardando_envio" ? "11883" : status === "entregue" ? "11884" : "11880",
        status: status === "all" ? "aguardando_pagamento" : status,
        total: 100.36,
      },
    ],
    page: filters.page ?? 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    ...overrides,
  };
}

function renderTable(initialFilters: VendorOrdersFilters, initialSnapshot = buildSnapshot(initialFilters)) {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <VendorOrdersTable initialFilters={initialFilters} initialSnapshot={initialSnapshot} />
    </SWRConfig>,
  );
}

describe("VendorOrdersTable", () => {
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

  it("switches tabs via pushState and fetches only the list data", async () => {
    fetchMock.mockImplementation((input) =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            String(input).includes("aguardando_envio")
              ? buildSnapshot({ status: "aguardando_envio" })
              : buildSnapshot({ status: "all" }),
          ),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );
    const user = userEvent.setup();

    renderTable({ page: 1, search: "", status: "all" });

    await user.click(screen.getByRole("button", { name: /aguardando envio/i }));

    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      "",
      "/vendor/pedidos?status=aguardando_envio",
    );

    expect(await screen.findAllByText("#11883")).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith("/api/vendor/orders?status=aguardando_envio", {
      headers: { Accept: "application/json" },
      method: "GET",
    });
  });

  it("reuses SWR cache when revisiting a tab and avoids the local loading state", async () => {
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      const snapshot =
        url.includes("aguardando_envio")
          ? buildSnapshot({ status: "aguardando_envio" })
          : buildSnapshot({ status: "entregue" });

      return Promise.resolve(
        new Response(JSON.stringify(snapshot), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    const user = userEvent.setup();

    renderTable({ page: 1, search: "", status: "all" });

    await user.click(screen.getByRole("button", { name: /aguardando envio/i }));
    expect(await screen.findAllByText("#11883")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /entregues/i }));
    expect(await screen.findAllByText("#11884")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /aguardando envio/i }));

    expect(screen.queryByText(/carregando pedidos/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("#11883")).toHaveLength(2);
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
    renderTable({ page: 3, search: "", status: "all" }, buildSnapshot({ page: 3 }, { totalPages: 3 }));

    await user.type(screen.getByPlaceholderText(/pedido ou cliente/i), "  Filipe ");
    await user.click(screen.getByRole("button", { name: /buscar/i }));

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

  it("keeps search and status when paginating", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify(buildSnapshot({ page: 2, search: "Filipe", status: "aguardando_envio" }, { totalPages: 2 })),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    const user = userEvent.setup();

    searchState = "status=aguardando_envio&search=Filipe";
    renderTable(
      { page: 1, search: "Filipe", status: "aguardando_envio" },
      buildSnapshot({ search: "Filipe", status: "aguardando_envio" }, { totalPages: 2 }),
    );

    await user.click(screen.getByRole("button", { name: /próxima/i }));

    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      "",
      "/vendor/pedidos?status=aguardando_envio&search=Filipe&page=2",
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/vendor/orders?status=aguardando_envio&search=Filipe&page=2",
        {
          headers: { Accept: "application/json" },
          method: "GET",
        },
      );
    });
  });
});
