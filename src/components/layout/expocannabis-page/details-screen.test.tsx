import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { attendanceReducer, initialAttendance } from "@/features/expocannabis/hooks/attendance-reducer";
import { buildEventContext } from "@/features/expocannabis/test/fixtures";

import { server } from "../../../../test/msw/server";
import { DetailsScreen } from "./details-screen";

const BUYER = {
  cnpj: "11222333000181",
  legalName: "Loja LTDA",
  tradeName: "Loja",
  address: { cep: "01001000", street: "Praça da Sé", city: "São Paulo", state: "SP", number: "", neighborhood: "" },
  companyId: null,
};

const QUOTE = {
  units: 14,
  level: { key: "parceiro", name: "Parceiro", minUnits: 10, pctBp: 500 },
  lines: [{ product_id: 200, qty: 14, unit_cents: 11162, subtotal_cents: 156268, discount_cents: 7813, total_cents: 148455, source: "event_level" }],
  kit: { qty: 0, unit_cents: 0, full_unit_cents: 0, total_cents: 0 },
  kitComponents: [],
  itemsCents: 148455,
  discountCents: 7813,
  kitSavingsCents: 0,
  shipping: { optionKey: "correios:pac", name: "PAC", priceCents: 2990, deliveryTime: 5, fingerprint: "fp" },
  totalCents: 151445,
  quoteFingerprint: "fingerprint",
};

function Harness() {
  const [state, dispatch] = useReducer(attendanceReducer, {
    ...initialAttendance(),
    screen: 3,
    buyer: BUYER,
    qty: { 200: 14 },
    delivery: { ...initialAttendance().delivery, cep: "01001000", street: "Praça da Sé", city: "São Paulo", state: "SP" },
  });
  return (
    <>
      <DetailsScreen context={buildEventContext()} state={state} dispatch={dispatch} />
      <output aria-label="tela">{state.screen}</output>
      <output aria-label="total cotado">{state.quote?.totalCents ?? ""}</output>
    </>
  );
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome de quem compra"), "Maria da Silva");
  await user.type(screen.getByLabelText("WhatsApp"), "11987654321");
  await user.type(screen.getByLabelText("E-mail"), "maria@loja.com.br");
  await user.type(screen.getByLabelText("Número"), "100");
  await user.type(screen.getByLabelText("Bairro"), "Sé");
}

describe("DetailsScreen", () => {
  it("recusa WhatsApp com 9 dígitos", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("WhatsApp"), "987654321");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("WhatsApp com DDD: 10 ou 11 números.")).toBeInTheDocument();
  });

  it("recusa e-mail inválido", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("E-mail"), "maria@");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("E-mail no formato nome@dominio.com.")).toBeInTheDocument();
  });

  it("Continuar inválido mostra Falta arrumar com número e bairro", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Falta arrumar: Nome, WhatsApp, E-mail, Número, Bairro");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
  });

  it("caminho feliz cadastra, cota e segue com o total do servidor", async () => {
    const calls: string[] = [];
    let quoteBody: unknown = null;
    server.use(
      http.post("*/api/expocannabis/buyers", async ({ request }) => {
        calls.push("buyers");
        expect(await request.json()).toEqual({ cnpj: "11222333000181", name: "Maria da Silva", phone: "11987654321", email: "maria@loja.com.br" });
        return HttpResponse.json({ companyId: 30, buyerUserId: 40, created: { company: true, user: true } });
      }),
      http.post("*/api/expocannabis/quote", async ({ request }) => {
        calls.push("quote");
        quoteBody = await request.json();
        return HttpResponse.json(QUOTE);
      }),
    );
    const user = userEvent.setup();
    render(<Harness />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByLabelText("tela")).toHaveTextContent("4");
    expect(calls).toEqual(["buyers", "quote"]);
    expect(quoteBody).toEqual({ items: [{ productId: 200, qty: 14 }], kits: 0, cep: "01001000", recipientCnpj: "11222333000181" });
    expect(screen.getByLabelText("total cotado")).toHaveTextContent("151445");
  });

  it("frete indisponível oferece Tentar de novo", async () => {
    server.use(
      http.post("*/api/expocannabis/buyers", () => HttpResponse.json({ companyId: 30, buyerUserId: 40, created: { company: false, user: false } })),
      http.post("*/api/expocannabis/quote", () =>
        HttpResponse.json({ code: "papelito_event_shipping_unavailable", message: "x" }, { status: 422 }),
      ),
    );
    const user = userEvent.setup();
    render(<Harness />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("Não conseguimos calcular o frete pra esse CEP.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    expect(screen.getByLabelText("tela")).toHaveTextContent("3");
  });

  it("falta de estoque volta para a loja", async () => {
    server.use(
      http.post("*/api/expocannabis/buyers", () => HttpResponse.json({ companyId: 30, buyerUserId: 40, created: { company: false, user: false } })),
      http.post("*/api/expocannabis/quote", () =>
        HttpResponse.json(
          { code: "papelito_event_out_of_stock", message: "x", data: { status: 409, products: [{ productId: 200, available: 3 }] } },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<Harness />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByLabelText("tela")).toHaveTextContent("2");
  });

  it("outro endereço exige CEP com 8 números", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("radio", { name: /Entregar em outro endereço/ }));
    await user.type(screen.getByLabelText("CEP"), "0100");
    await user.click(screen.getByRole("button", { name: "Buscar CEP" }));

    expect(screen.getByText("O CEP tem 8 números. Confere aí?")).toBeInTheDocument();
  });
});
