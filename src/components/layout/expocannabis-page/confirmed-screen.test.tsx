import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { initialAttendance } from "@/features/expocannabis/hooks/attendance-reducer";
import { ATTENDANCE_STORAGE_KEY } from "@/features/expocannabis/hooks/use-attendance";
import { buildEventContext } from "@/features/expocannabis/test/fixtures";

import { server } from "../../../../test/msw/server";
import { ExpocannabisApp } from "./expocannabis-app";


const PAID = {
  ...initialAttendance(),
  screen: 5,
  buyer: {
    cnpj: "11222333000181",
    legalName: "Loja LTDA",
    tradeName: "Loja",
    address: { cep: "01001000", street: "Praça da Sé", city: "São Paulo", state: "SP", number: "", neighborhood: "" },
    companyId: 30,
  },
  qty: { 200: 14 },
  contact: { name: "Maria", phone: "11987654321", email: "maria@loja.com.br" },
  quote: {
    units: 14,
    level: { key: "parceiro", name: "Parceiro", minUnits: 10, pctBp: 500 },
    lines: [],
    kit: { qty: 0, unitCents: 0, fullUnitCents: 0, totalCents: 0 },
    itemsCents: 148455,
    discountCents: 7813,
    kitSavingsCents: 0,
    shipping: { optionKey: "correios:pac", name: "PAC", priceCents: 2990, deliveryTime: 5 },
    totalCents: 151445,
    quoteFingerprint: "fp",
  },
  order: { orderId: 501, orderNumber: "501", state: "paid", detail: "", totalCents: 151445, method: "pix" },
};

const PAID_DELIVERY = initialAttendance().delivery;

describe("ConfirmedScreen", () => {
  beforeEach(() => {
    window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(PAID));
  });

  it("mostra o resumo pago, a economia e o brinde", () => {
    render(<ExpocannabisApp context={buildEventContext()} />);

    expect(screen.getByRole("heading", { name: "Pedido confirmado!" })).toBeInTheDocument();
    expect(screen.getByText(/14 unidades · R\$\s?1\.514,45 · pago no Pix/)).toBeInTheDocument();
    expect(screen.getByText("Você economizou")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?78,13/)).toBeInTheDocument();
    expect(screen.getByText("5% do nível")).toBeInTheDocument();
    expect(screen.getByText("Retire agora no balcão")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enviar resumo no WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5511987654321?text="),
    );
  });

  it.each(["cnpj", "other"] as const)("mostra o endereço de entrega completo no modo %s", (mode) => {
    const delivery = {
      ...PAID_DELIVERY,
      mode,
      cep: "01001000",
      street: "Praça da Sé",
      number: "100",
      complement: "Sala 2",
      neighborhood: "Sé",
      city: "São Paulo",
      state: "SP",
    };
    window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify({ ...PAID, delivery }));
    render(<ExpocannabisApp context={buildEventContext()} />);

    expect(screen.getByText("Praça da Sé, 100 · Sala 2 · Sé · São Paulo/SP · CEP 01001-000.")).toBeInTheDocument();
  });

  it("Quero participar grava o lead", async () => {
    let calls = 0;
    server.use(
      http.post("*/api/expocannabis/orders/501/lead", () => {
        calls += 1;
        return HttpResponse.json({ orderId: 501, lead: true });
      }),
    );
    const user = userEvent.setup();
    render(<ExpocannabisApp context={buildEventContext()} />);

    await user.click(screen.getByRole("button", { name: "Quero participar" }));

    expect(await screen.findByText("Anotado ✓")).toBeInTheDocument();
    expect(calls).toBe(1);
  });

  it("Novo pedido limpa o storage e volta ao CNPJ", async () => {
    const user = userEvent.setup();
    render(<ExpocannabisApp context={buildEventContext()} />);

    await user.click(screen.getByRole("button", { name: "Novo pedido" }));

    expect(screen.getByRole("heading", { name: "Qual o CNPJ da loja?" })).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(ATTENDANCE_STORAGE_KEY) ?? "{}").order ?? null).toBeNull();
  });
});
