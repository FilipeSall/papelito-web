import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/features/cart";
import { buildCartItem } from "../../../../test/factories/cart";
import { server } from "../../../../test/msw/server";
import { renderWithProviders } from "../../../../test/utils/render-with-providers";
import { CartPageContent } from "./cart-page-content";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("CartPageContent stock validation", () => {
  beforeEach(() => {
    pushMock.mockReset();
    useCartStore.setState({
      items: [buildCartItem({ id: "1", quantity: 5 })],
      coupon: null,
    });
  });

  it("limits a persisted quantity when the stock was reduced", async () => {
    renderWithProviders(<CartPageContent />);

    await waitFor(() => {
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });

    expect(
      screen.getByText("Existem apenas 3 unidades deste produto em estoque."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Aumentar quantidade" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("increases up to the available stock and then disables the add button", async () => {
    useCartStore.setState({
      items: [buildCartItem({ id: "1", quantity: 1 })],
      coupon: null,
    });
    const user = userEvent.setup();

    renderWithProviders(<CartPageContent />);

    const increaseButton = screen.getByRole("button", {
      name: "Aumentar quantidade",
    });
    await waitFor(() => expect(increaseButton).toBeEnabled());

    await user.click(increaseButton);
    await waitFor(() => {
      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });

    await user.click(increaseButton);
    await waitFor(() => {
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });
    expect(increaseButton).toHaveAttribute("aria-disabled", "true");
  });

  it("exposes a stock tooltip on the increase button once the limit is reached", async () => {
    renderWithProviders(<CartPageContent />);

    const increaseButton = await screen.findByRole("button", {
      name: "Aumentar quantidade",
    });
    await waitFor(() => expect(increaseButton).toHaveAttribute("aria-disabled", "true"));

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Não há mais unidades disponíveis");
    expect(increaseButton).toHaveAttribute(
      "aria-describedby",
      tooltip.getAttribute("id"),
    );
  });

  it("keeps the current quantity and warns when fresh stock is lower", async () => {
    let requestCount = 0;
    server.use(
      http.post("/api/cart/stock", () => {
        requestCount += 1;
        const stockQty = requestCount === 1 ? 3 : 2;
        return HttpResponse.json({
          status: "ok",
          products: {
            "1": { available: true, stockQty },
          },
        });
      }),
    );
    useCartStore.setState({
      items: [buildCartItem({ id: "1", quantity: 2 })],
      coupon: null,
    });
    const user = userEvent.setup();

    renderWithProviders(<CartPageContent />);

    const increaseButton = screen.getByRole("button", {
      name: "Aumentar quantidade",
    });
    await waitFor(() => expect(increaseButton).toBeEnabled());
    await user.click(increaseButton);

    expect(useCartStore.getState().items[0].quantity).toBe(2);
    expect(
      await screen.findByText(
        "Existem apenas 2 unidades deste produto em estoque.",
      ),
    ).toBeInTheDocument();
    expect(increaseButton).toHaveAttribute("aria-disabled", "true");
  });

  it("revalidates and stops navigation when stock changed before checkout", async () => {
    let requestCount = 0;
    server.use(
      http.post("/api/cart/stock", () => {
        requestCount += 1;
        const stockQty = requestCount === 1 ? 3 : 2;
        return HttpResponse.json({
          status: "ok",
          products: {
            "1": { available: true, stockQty },
          },
        });
      }),
    );
    useCartStore.setState({
      items: [buildCartItem({ id: "1", quantity: 3 })],
      coupon: null,
    });
    const user = userEvent.setup();

    renderWithProviders(<CartPageContent />);

    const checkoutButton = await screen.findByRole("button", {
      name: /finalizar compra/i,
    });
    await user.click(checkoutButton);

    await waitFor(() => {
      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });
    expect(pushMock).not.toHaveBeenCalled();
    expect(
      screen.getByText("Existem apenas 2 unidades deste produto em estoque."),
    ).toBeInTheDocument();
  });

  it("keeps an out-of-stock item visible while allowing it to be decreased", async () => {
    server.use(
      http.post("/api/cart/stock", () =>
        HttpResponse.json({
          status: "ok",
          products: {
            "1": { available: false, stockQty: 0 },
          },
        }),
      ),
    );
    useCartStore.setState({
      items: [buildCartItem({ id: "1", quantity: 2 })],
      coupon: null,
    });
    const user = userEvent.setup();

    renderWithProviders(<CartPageContent />);

    expect(
      await screen.findByText("Este produto está sem estoque no momento."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Aumentar quantidade" }),
    ).toHaveAttribute("aria-disabled", "true");

    await user.click(screen.getByRole("button", { name: "Diminuir quantidade" }));
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    expect(
      screen.getByText("Este produto está sem estoque no momento."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Diminuir quantidade" }));
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("serializes consecutive increase clicks for the same product", async () => {
    let requestCount = 0;
    server.use(
      http.post("/api/cart/stock", async () => {
        requestCount += 1;
        return HttpResponse.json({
          status: "ok",
          products: {
            "1": { available: true, stockQty: 3 },
          },
        });
      }),
    );
    useCartStore.setState({
      items: [buildCartItem({ id: "1", quantity: 1 })],
      coupon: null,
    });

    renderWithProviders(<CartPageContent />);

    const increaseButton = screen.getByRole("button", {
      name: "Aumentar quantidade",
    });
    await waitFor(() => expect(increaseButton).toBeEnabled());

    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);

    await waitFor(() => {
      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });
    expect(requestCount).toBe(2);
  });

  it("fails closed when current stock cannot be consulted", async () => {
    server.use(
      http.post("/api/cart/stock", () =>
        HttpResponse.json(
          {
            status: "unavailable",
            message: "Estoque temporariamente indisponivel.",
          },
          { status: 503 },
        ),
      ),
    );
    useCartStore.setState({
      items: [buildCartItem({ id: "1", quantity: 1 })],
      coupon: null,
    });
    const user = userEvent.setup();

    renderWithProviders(<CartPageContent />);

    expect(
      await screen.findByText(
        "Não foi possível validar o estoque agora. Tente novamente.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    await user.click(screen.getByRole("button", { name: /finalizar compra/i }));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("advances to checkout only after a successful fresh validation", async () => {
    useCartStore.setState({
      items: [buildCartItem({ id: "1", quantity: 1 })],
      coupon: null,
    });
    const user = userEvent.setup();

    renderWithProviders(<CartPageContent />);

    const checkoutButton = await screen.findByRole("button", {
      name: /finalizar compra/i,
    });
    await user.click(checkoutButton);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/checkout");
    });
  });

  it("shows a spinner in place of the quantity and disables both buttons while checking stock", async () => {
    const deferred = createDeferred<void>();
    let requestCount = 0;
    server.use(
      http.post("/api/cart/stock", async () => {
        requestCount += 1;
        if (requestCount > 1) {
          await deferred.promise;
        }
        return HttpResponse.json({
          status: "ok",
          products: { "1": { available: true, stockQty: 5 } },
        });
      }),
    );
    useCartStore.setState({
      items: [buildCartItem({ id: "1", quantity: 1 })],
      coupon: null,
    });
    const user = userEvent.setup();

    renderWithProviders(<CartPageContent />);

    const increaseButton = screen.getByRole("button", {
      name: "Aumentar quantidade",
    });
    const decreaseButton = screen.getByRole("button", {
      name: "Diminuir quantidade",
    });
    const control = increaseButton.closest("[aria-busy]") as HTMLElement;
    await waitFor(() => expect(increaseButton).toBeEnabled());

    await user.click(increaseButton);

    expect(await screen.findByText("Verificando estoque")).toBeInTheDocument();
    expect(within(control).queryByText("1")).not.toBeInTheDocument();
    expect(increaseButton).toBeDisabled();
    expect(decreaseButton).toBeDisabled();

    deferred.resolve();

    await waitFor(() => {
      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });
    expect(screen.queryByText("Verificando estoque")).not.toBeInTheDocument();
    expect(within(control).getByText("2")).toBeInTheDocument();
    expect(increaseButton).toBeEnabled();
    expect(decreaseButton).toBeEnabled();
  });

  it("shows the loading state only on the clicked item", async () => {
    const deferred = createDeferred<void>();
    server.use(
      http.post("/api/cart/stock", async ({ request }) => {
        const body = (await request.json()) as {
          items?: Array<{ productId?: number }>;
        };
        if (body.items?.length === 1) {
          await deferred.promise;
        }
        return HttpResponse.json({
          status: "ok",
          products: {
            "1": { available: true, stockQty: 5 },
            "2": { available: true, stockQty: 5 },
          },
        });
      }),
    );
    useCartStore.setState({
      items: [
        buildCartItem({ id: "1", name: "Produto Um", quantity: 1 }),
        buildCartItem({ id: "2", name: "Produto Dois", quantity: 1 }),
      ],
      coupon: null,
    });
    const user = userEvent.setup();

    renderWithProviders(<CartPageContent />);

    const increaseButtons = await screen.findAllByRole("button", {
      name: "Aumentar quantidade",
    });
    await waitFor(() => expect(increaseButtons[0]).toBeEnabled());

    await user.click(increaseButtons[0]);

    expect(await screen.findByText("Verificando estoque")).toBeInTheDocument();

    const controls = screen
      .getAllByText("Verificando estoque")
      .map((node) => node.closest("[aria-busy]"));
    expect(controls).toHaveLength(1);

    const secondIncrease = screen.getAllByRole("button", {
      name: "Aumentar quantidade",
    })[1];
    const secondDecrease = screen.getAllByRole("button", {
      name: "Diminuir quantidade",
    })[1];
    expect(secondIncrease).toBeEnabled();
    expect(secondDecrease).toBeEnabled();

    deferred.resolve();
    await waitFor(() => {
      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });
    expect(useCartStore.getState().items[1].quantity).toBe(1);
  });

  it("clears the loading state and preserves the quantity on a network error", async () => {
    const deferred = createDeferred<void>();
    let requestCount = 0;
    server.use(
      http.post("/api/cart/stock", async () => {
        requestCount += 1;
        if (requestCount > 1) {
          await deferred.promise;
          return HttpResponse.json(
            {
              status: "unavailable",
              message: "Estoque temporariamente indisponivel.",
            },
            { status: 503 },
          );
        }
        return HttpResponse.json({
          status: "ok",
          products: { "1": { available: true, stockQty: 5 } },
        });
      }),
    );
    useCartStore.setState({
      items: [buildCartItem({ id: "1", quantity: 1 })],
      coupon: null,
    });
    const user = userEvent.setup();

    renderWithProviders(<CartPageContent />);

    const increaseButton = screen.getByRole("button", {
      name: "Aumentar quantidade",
    });
    const control = increaseButton.closest("[aria-busy]") as HTMLElement;
    await waitFor(() => expect(increaseButton).toBeEnabled());

    await user.click(increaseButton);
    expect(await screen.findByText("Verificando estoque")).toBeInTheDocument();
    expect(control).toHaveAttribute("aria-busy", "true");

    deferred.resolve();

    await waitFor(() => {
      expect(control).toHaveAttribute("aria-busy", "false");
    });
    expect(screen.queryByText("Verificando estoque")).not.toBeInTheDocument();
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    expect(within(control).getByText("1")).toBeInTheDocument();
    expect(increaseButton).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Diminuir quantidade" }),
    ).toBeEnabled();
  });
});
