import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockedFunction,
} from "vitest";

import { buildProduct } from "../../../test/factories/product";
import { buildVendor } from "../../../test/factories/vendor";
import {
  ADD_TO_CART_EVENT_NAME,
  AddToCartButton,
} from "./add-to-cart-button";
import { resolveCartVendor, useCartStore } from "@/features/cart";

const pushMock = vi.fn();
let authState = {
  isAuthenticated: true,
  isAdministrator: false,
  isSeller: false,
  isLoading: false,
  isRoleLoading: false,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => authState,
}));

vi.mock("@/features/cart", async () => {
  const actual = await vi.importActual<typeof import("@/features/cart")>("@/features/cart");

  return {
    ...actual,
    resolveCartVendor: vi.fn(),
  };
});

describe("AddToCartButton", () => {
  const resolveCartVendorMock = resolveCartVendor as MockedFunction<typeof resolveCartVendor>;

  beforeEach(() => {
    authState = {
      isAuthenticated: true,
      isAdministrator: false,
      isSeller: false,
      isLoading: false,
      isRoleLoading: false,
    };
    pushMock.mockReset();
    resolveCartVendorMock.mockReset();
    useCartStore.setState({ items: [], coupon: null });
  });

  it("redirects unauthenticated users to login", async () => {
    authState.isAuthenticated = false;
    const user = userEvent.setup();

    render(<AddToCartButton label="Comprar" product={buildProduct()} />);

    await user.click(screen.getByRole("button", { name: /adicionar ao carrinho/i }));

    expect(pushMock).toHaveBeenCalledWith("/entrar");
  });

  it("shows disabled state and label when a disabled reason is provided", () => {
    render(
      <AddToCartButton
        label="Comprar"
        product={buildProduct()}
        disabledReason="O vendor da sua região não tem esse produto."
      />,
    );

    expect(screen.getByRole("button", { name: /adicionar ao carrinho/i })).toBeDisabled();
    expect(screen.getByText("Indisponível")).toBeInTheDocument();
  });

  it("blocks sellers from purchasing", () => {
    authState.isSeller = true;

    render(<AddToCartButton label="Comprar" product={buildProduct()} />);

    expect(screen.getByRole("button", { name: /adicionar ao carrinho/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /adicionar ao carrinho/i })).toHaveAttribute(
      "title",
      "Vendors nao compram pela plataforma.",
    );
  });

  it("adds the resolved product to the cart and emits the success event", async () => {
    const user = userEvent.setup();
    const listener = vi.fn();
    resolveCartVendorMock.mockResolvedValue({
      status: "ok",
      vendor: buildVendor(),
    });
    window.addEventListener(ADD_TO_CART_EVENT_NAME, listener as EventListener);

    render(<AddToCartButton label="Comprar" product={buildProduct()} />);

    await user.click(screen.getByRole("button", { name: /adicionar ao carrinho/i }));

    await waitFor(() => {
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    window.removeEventListener(ADD_TO_CART_EVENT_NAME, listener as EventListener);
  });
});
