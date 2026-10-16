import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCheckoutStore } from "@/features/checkout";
import type { ProfileOrderDetail, ProfileOrderPaymentInfo } from "@/features/orders/types/profile-order-detail";
import { server } from "../../../../test/msw/server";
import { renderWithProviders } from "../../../../test/utils/render-with-providers";
import { CheckoutPendingPayment } from "./checkout-pending-payment";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const refreshMock = vi.fn();
const MP_URL = "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1-abc";
const ORDER_URL = "/api/profile/orders/51";
const CONTINUE_URL = "/api/checkout/payment-attempts/31/continue";
const session = {
  user: { id: "3" },
  expires: "2099-01-01T00:00:00.000Z",
  b2b: { canPurchase: true, companyId: 10, purchaseMode: "b2b" as const },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock, refresh: refreshMock }),
}));
vi.mock("next/image", () => ({ default: () => null }));

function buildOrder(payment: Partial<ProfileOrderPaymentInfo>): ProfileOrderDetail {
  return {
    id: "51",
    orderNumber: "#51",
    status: "awaiting_payment",
    dateLabel: "16 de out. de 2026",
    storeLabel: "Loja Centro",
    tracking: null,
    shipments: [],
    timeline: [],
    deliveryAddress: "Rua A, 10",
    items: [{ id: "1", name: "Seda", quantity: 1, unitPrice: 90 }],
    subtotal: 90,
    shipping: 8.9,
    total: 98.9,
    payment: { methodLabel: "Mercado Pago", maskedLabel: "", ...payment },
    documentsSurface: "pedido",
    receipt: { number: null, available: false, issuedAtLabel: null },
    fiscalDocument: null,
    returns: { canRequest: false, reason: "", message: "", windowDays: 0, windowEndsAt: "", items: [] },
    returnRequests: [],
    refund: null,
  };
}

const mercadoPagoPending = buildOrder({ state: "pending", provider: "mercadopago", flow: "redirect", redirectUrl: MP_URL });

function countPlaceOrders() {
  const counter = { calls: 0 };
  server.use(
    http.post("/api/checkout/place-order", () => {
      counter.calls += 1;
      return HttpResponse.json({});
    }),
  );
  return counter;
}

describe("CheckoutPendingPayment — Mercado Pago", () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
    useCheckoutStore.getState().resetCheckout();
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("status=approved na volta do Mercado Pago não mostra pago sem o servidor", () => {
    window.history.replaceState(null, "", "/checkout/pagamento/51?retorno=mercadopago&status=approved");

    renderWithProviders(<CheckoutPendingPayment initialOrder={mercadoPagoPending} />, { session });

    expect(screen.getByText(/estamos confirmando seu pagamento com o mercado pago/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /voltar ao mercado pago/i })).toHaveAttribute("href", MP_URL);
    expect(screen.queryByText(/pagamento confirmado/i)).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("estado desconhecido aguarda a reconciliação sem link de pagamento", () => {
    renderWithProviders(<CheckoutPendingPayment initialOrder={buildOrder({ state: "unknown", provider: "mercadopago", flow: "redirect" })} />, { session });

    expect(screen.getByText(/estamos confirmando seu pagamento com o mercado pago/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /voltar ao mercado pago/i })).not.toBeInTheDocument();
  });

  it("atualiza sozinha e só confirma quando o servidor diz pago", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    server.use(http.get(ORDER_URL, () => HttpResponse.json(buildOrder({ state: "paid", provider: "mercadopago", flow: "redirect" }))));

    renderWithProviders(<CheckoutPendingPayment initialOrder={mercadoPagoPending} />, { session });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/checkout/sucesso/51"));
  });

  it("erro de rede no acompanhamento não dispara novo checkout", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const placeOrders = countPlaceOrders();
    server.use(http.get(ORDER_URL, () => HttpResponse.error()));

    renderWithProviders(<CheckoutPendingPayment initialOrder={mercadoPagoPending} />, { session });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(placeOrders.calls).toBe(0);
    expect(replaceMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByText(/estamos confirmando seu pagamento com o mercado pago/i)).toBeInTheDocument();
  });

  it("pagamento recusado no Mercado Pago não oferece volta ao link", () => {
    renderWithProviders(<CheckoutPendingPayment initialOrder={buildOrder({ state: "failed", provider: "mercadopago", flow: "redirect" })} />, { session });

    expect(screen.getByText(/o mercado pago não aprovou o pagamento/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /voltar ao mercado pago/i })).not.toBeInTheDocument();
  });
});

describe("CheckoutPendingPayment — Pagar.me em reconciliação", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sem QR Code nem boleto, acompanha o pedido e segue para o sucesso quando o servidor confirma", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    server.use(http.get(ORDER_URL, () => HttpResponse.json(buildOrder({ state: "paid", provider: "pagarme", flow: "direct" }))));

    renderWithProviders(<CheckoutPendingPayment initialOrder={buildOrder({ state: "unknown", provider: "pagarme", flow: "direct" })} />, { session });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/checkout/sucesso/51"));
  });
});

describe("CheckoutPendingPayment — coleta Pagar.me da tentativa", () => {
  const pagarmeAwaiting = buildOrder({ state: "", methodLabel: "Pagar.me" });

  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
    useCheckoutStore.getState().resetCheckout();
    useCheckoutStore.getState().setPendingPaymentAttempt({ orderId: 51, paymentAttemptId: 31, configurationVersion: "cfg-2" });
  });

  it("envia o pagamento para a mesma tentativa, sem novo place-order", async () => {
    const placeOrders = countPlaceOrders();
    let body: unknown = null;
    server.use(
      http.post(CONTINUE_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          order_id: 51,
          order_number: "51",
          status: "pending",
          payment: { method: "pix", state: "pending", provider: "pagarme", flow: "requires_payment_input", paymentAttemptId: 31, configurationVersion: "cfg-2", pix: { qr_code: "000201" } },
        });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutPendingPayment initialOrder={pagarmeAwaiting} />, { session });

    await user.click(await screen.findByRole("button", { name: /pix/i }));
    await user.dblClick(screen.getByRole("button", { name: /pagar pedido/i }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(body).toEqual({ expectedCompanyId: 10, configurationVersion: "cfg-2", payment: { method: "pix" } });
    expect(placeOrders.calls).toBe(0);
    expect(useCheckoutStore.getState().pendingPaymentAttempt).toBeNull();
  });

  it("pagamento já confirmado pelo servidor segue para o sucesso", async () => {
    server.use(
      http.post(CONTINUE_URL, () =>
        HttpResponse.json({
          order_id: 51,
          status: "processing",
          payment: { method: "pix", state: "paid", provider: "pagarme", flow: "requires_payment_input", paymentAttemptId: 31 },
        }),
      ),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutPendingPayment initialOrder={pagarmeAwaiting} />, { session });

    await user.click(await screen.findByRole("button", { name: /pix/i }));
    await user.click(screen.getByRole("button", { name: /pagar pedido/i }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/checkout/sucesso/51"));
  });

  it("configuração obsoleta pede atualização sem cobrar", async () => {
    const placeOrders = countPlaceOrders();
    server.use(
      http.post(CONTINUE_URL, () => HttpResponse.json({ code: "papelito_payment_configuration_stale", message: "" }, { status: 409 })),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutPendingPayment initialOrder={pagarmeAwaiting} />, { session });

    await user.click(await screen.findByRole("button", { name: /pix/i }));
    await user.click(screen.getByRole("button", { name: /pagar pedido/i }));

    expect(await screen.findByText("As condições de pagamento mudaram. Atualize a página antes de pagar.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /atualizar página/i }));
    expect(refreshMock).toHaveBeenCalled();
    expect(useCheckoutStore.getState().pendingPaymentAttempt).not.toBeNull();
    expect(placeOrders.calls).toBe(0);
  });

  it("não reaproveita a coleta para outro pedido", () => {
    renderWithProviders(<CheckoutPendingPayment initialOrder={{ ...pagarmeAwaiting, id: "99" }} />, { session });

    expect(screen.queryByRole("button", { name: /pagar pedido/i })).not.toBeInTheDocument();
  });
});

describe("CheckoutPendingPayment — coleta a partir do servidor", () => {
  const serverAwaiting = buildOrder({
    methodLabel: "Pagar.me",
    state: "awaiting_payment_input",
    provider: "pagarme",
    flow: "requires_payment_input",
    paymentAttemptId: 31,
    configurationVersion: "cfg-2",
  });

  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
    useCheckoutStore.getState().resetCheckout();
  });

  it("retoma a coleta em outro aparelho, sem tentativa no store", async () => {
    let body: unknown = null;
    server.use(
      http.post(CONTINUE_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          order_id: 51,
          status: "pending",
          payment: { method: "boleto", state: "pending", provider: "pagarme", flow: "requires_payment_input", paymentAttemptId: 31 },
        });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutPendingPayment initialOrder={serverAwaiting} />, { session });

    await user.click(await screen.findByRole("button", { name: /boleto/i }));
    await user.click(screen.getByRole("button", { name: /pagar pedido/i }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(body).toEqual({ expectedCompanyId: 10, configurationVersion: "cfg-2", payment: { method: "boleto" } });
  });

  it("o servidor vence a tentativa guardada no store", () => {
    useCheckoutStore.getState().setPendingPaymentAttempt({ orderId: 51, paymentAttemptId: 31, configurationVersion: "cfg-2" });
    const charged = buildOrder({ state: "pending", provider: "pagarme", flow: "requires_payment_input", paymentAttemptId: 31 });

    renderWithProviders(<CheckoutPendingPayment initialOrder={charged} />, { session });

    expect(screen.queryByRole("button", { name: /pagar pedido/i })).not.toBeInTheDocument();
  });

  it("condições mudadas pedem nova confirmação com a versão nova, sem reenviar sozinho", async () => {
    const versions: unknown[] = [];
    server.use(
      http.post(CONTINUE_URL, async ({ request }) => {
        const body = (await request.json()) as { configurationVersion?: string };
        versions.push(body.configurationVersion);

        if (versions.length === 1) {
          return HttpResponse.json(
            { code: "papelito_payment_configuration_stale", message: "", configurationVersion: "cfg-3" },
            { status: 409 },
          );
        }

        return HttpResponse.json({
          order_id: 51,
          status: "pending",
          payment: { method: "pix", state: "pending", provider: "pagarme", flow: "requires_payment_input", paymentAttemptId: 31 },
        });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutPendingPayment initialOrder={serverAwaiting} />, { session });

    await user.click(await screen.findByRole("button", { name: /pix/i }));
    await user.click(screen.getByRole("button", { name: /pagar pedido/i }));

    expect(await screen.findByText(/as condições de pagamento mudaram/i)).toBeInTheDocument();
    expect(versions).toEqual(["cfg-2"]);
    expect(refreshMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /pagar pedido/i }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(versions).toEqual(["cfg-2", "cfg-3"]);
  });

  it("sem gateway apto o pedido é encerrado com volta às compras", async () => {
    server.use(
      http.post(CONTINUE_URL, () =>
        HttpResponse.json({ code: "papelito_payment_attempt_closed", message: "" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutPendingPayment initialOrder={serverAwaiting} />, { session });

    await user.click(await screen.findByRole("button", { name: /pix/i }));
    await user.click(screen.getByRole("button", { name: /pagar pedido/i }));

    expect(await screen.findByText("Este pagamento não pode mais ser concluído. Refaça o pedido.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /voltar a comprar/i })).toHaveAttribute("href", "/produtos");
    expect(screen.queryByRole("button", { name: /pagar pedido/i })).not.toBeInTheDocument();
  });
});

