import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useReducer } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { attendanceReducer, initialAttendance } from "@/features/expocannabis/hooks/attendance-reducer";
import { buildEventContext } from "@/features/expocannabis/test/fixtures";
import type { EventQuote } from "@/features/expocannabis/types/quote";

import { server } from "../../../../test/msw/server";
import { PaymentScreen } from "./payment-screen";

const QUOTE: EventQuote = {
  units: 14,
  level: { key: "parceiro", name: "Parceiro", minUnits: 10, pctBp: 500 },
  lines: [{ productId: 200, qty: 14, unitCents: 11162, subtotalCents: 156268, discountCents: 7813, totalCents: 148455 }],
  kit: { qty: 0, unitCents: 0, fullUnitCents: 0, totalCents: 0 },
  itemsCents: 148455,
  discountCents: 7813,
  kitSavingsCents: 0,
  shipping: { optionKey: "correios:pac", name: "PAC", priceCents: 2990, deliveryTime: 5 },
  totalCents: 151445,
  quoteFingerprint: "fingerprint",
};

const BUYER = {
  cnpj: "11222333000181",
  legalName: "Loja LTDA",
  tradeName: "Loja",
  address: { cep: "01001000", street: "Praça da Sé", city: "São Paulo", state: "SP", number: "", neighborhood: "" },
  companyId: 30,
};

function status(state: string, detail = "") {
  return { orderId: 501, orderNumber: "501", state, detail, totalCents: 151445, method: "card" };
}

const TWO_TERMINALS = [
  { id: "NEWLAND_N950__N950NCD600451364", label: "Maquininha final 1364" },
  { id: "NEWLAND_N950__N950NCD700342623", label: "Maquininha final 2623" },
];

function Harness({ canSupervise = false, terminals }: Readonly<{ canSupervise?: boolean; terminals?: typeof TWO_TERMINALS }>) {
  const [state, dispatch] = useReducer(attendanceReducer, {
    ...initialAttendance(),
    screen: 4,
    buyer: BUYER,
    qty: { 200: 14 },
    quote: QUOTE,
    registered: { companyId: 30, buyerUserId: 40, created: { company: false, user: false } },
    delivery: { ...initialAttendance().delivery, cep: "01001000", street: "Praça da Sé", number: "100", neighborhood: "Sé", city: "São Paulo", state: "SP" },
  });
  const base = buildEventContext({ operator: { name: "Operadora", canSupervise } });
  const context = terminals ? { ...base, terminals } : base;
  return (
    <>
      <PaymentScreen context={context} state={state} dispatch={dispatch} />
      <output aria-label="tela">{state.screen}</output>
      <output aria-label="pedido">{state.order?.orderId ?? ""}</output>
      <output aria-label="chave">{state.checkoutAttemptId ?? ""}</output>
    </>
  );
}

const CHARGE = /Cobrar R\$\s?1\.514,45 na maquininha/;

describe("PaymentScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("com uma maquininha só não pergunta e cobra nela", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post("*/api/expocannabis/orders", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(status("at_terminal"));
      }),
    );
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByRole("radiogroup", { name: "Maquininha" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: CHARGE }));

    expect(await screen.findByText("Passe o cartão ou leia o Pix na maquininha")).toBeInTheDocument();
    expect(body.terminalId).toBe("NEWLAND_N950__N950NCD600451364");
  });

  it("com duas maquininhas começa na cadastrada e lembra a escolhida", async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      http.post("*/api/expocannabis/orders", async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json(status("at_terminal"));
      }),
    );
    const user = userEvent.setup();
    const first = render(<Harness terminals={TWO_TERMINALS} />);

    const picker = screen.getByRole("radiogroup", { name: "Maquininha" });
    expect(within(picker).getByRole("radio", { name: /Maquininha final 1364/ })).toHaveAttribute("aria-checked", "true");
    await user.click(within(picker).getByRole("radio", { name: /Maquininha final 2623/ }));
    await user.click(screen.getByRole("button", { name: CHARGE }));
    expect(await screen.findByText("Cobrando na Maquininha final 2623")).toBeInTheDocument();
    expect(bodies[0].terminalId).toBe("NEWLAND_N950__N950NCD700342623");
    first.unmount();

    render(<Harness terminals={TWO_TERMINALS} />);
    expect(within(screen.getByRole("radiogroup", { name: "Maquininha" })).getByRole("radio", { name: /Maquininha final 2623/ })).toHaveAttribute("aria-checked", "true");
  });

  it("não deixa voltar aos dados com a cobrança em andamento ou sem desfecho", async () => {
    let answer: () => void = () => undefined;
    server.use(
      http.post("*/api/expocannabis/orders", async () => {
        await new Promise<void>((resolve) => {
          answer = resolve;
        });
        return HttpResponse.json({ code: "papelito_event_terminal_unavailable", message: "A maquininha não respondeu." }, { status: 503 });
      }),
    );
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByRole("button", { name: /Voltar aos dados/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: CHARGE }));

    expect(screen.queryByRole("button", { name: /Voltar aos dados/ })).not.toBeInTheDocument();
    act(() => answer());
    expect(await screen.findByText("A maquininha não respondeu.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Voltar aos dados/ })).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "chave" }).textContent).not.toBe("");
  });

  it("dois cliques em Cobrar criam uma cobrança só", async () => {
    let creates = 0;
    server.use(
      http.post("*/api/expocannabis/orders", async () => {
        creates += 1;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(status("at_terminal"));
      }),
    );
    const user = userEvent.setup();
    render(<Harness />);

    const button = screen.getByRole("button", { name: CHARGE });
    await user.dblClick(button);

    expect(await screen.findByText("Passe o cartão ou leia o Pix na maquininha")).toBeInTheDocument();
    expect(creates).toBe(1);
  });

  it("acompanha até pago e vai para a confirmação", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const states = ["at_terminal", "paid"];
    server.use(
      http.post("*/api/expocannabis/orders", () => HttpResponse.json(status("sending"))),
      http.get("*/api/expocannabis/orders/501/status", () => HttpResponse.json(status(states.shift() ?? "paid"))),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: CHARGE }));
    expect(await screen.findByText("Mandando pra maquininha…")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(await screen.findByText("Passe o cartão ou leia o Pix na maquininha")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(await screen.findByLabelText("tela")).toHaveTextContent("5");
  });

  it("mostra maquininha ocupada e permite tentar de novo", async () => {
    server.use(
      http.post("*/api/expocannabis/orders", () => HttpResponse.json(status("failed", "terminal_busy"))),
      http.post("*/api/expocannabis/orders/501/retry", () => HttpResponse.json({ ...status("at_terminal"), method: "pix" })),
    );
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: CHARGE }));

    expect(await screen.findByText("Maquininha ocupada. Cancele a cobrança anterior ou espere 5 min.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText("Passe o cartão ou leia o Pix na maquininha")).toBeInTheDocument();
  });

  it("liberação manual some sem permissão de supervisor", async () => {
    server.use(http.post("*/api/expocannabis/orders", () => HttpResponse.json(status("check_terminal", "unknown"))));
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: CHARGE }));

    expect(await screen.findByText("Confira na maquininha")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Liberar manualmente" })).not.toBeInTheDocument();
  });

  it("supervisor libera manualmente com NSU, forma e motivo", async () => {
    let body: unknown = null;
    server.use(
      http.post("*/api/expocannabis/orders", () => HttpResponse.json(status("check_terminal", "unknown"))),
      http.post("*/api/expocannabis/orders/501/manual-confirm", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(status("paid", "manual_release"));
      }),
    );
    const user = userEvent.setup();
    render(<Harness canSupervise />);

    await user.click(screen.getByRole("button", { name: CHARGE }));
    await user.click(await screen.findByRole("button", { name: "Liberar manualmente" }));
    await user.type(screen.getByLabelText("NSU ou ID da transação"), "000123");
    await user.type(screen.getByLabelText("Motivo"), "A máquina aprovou e o sistema não viu");
    await user.click(screen.getByRole("button", { name: "Liberar pagamento" }));

    expect(await screen.findByLabelText("tela")).toHaveTextContent("5");
    expect(body).toEqual({ nsu: "000123", method: "card", reason: "A máquina aprovou e o sistema não viu" });
  });

  it("acompanhamento atrasado não restaura a cobrança abandonada", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let releasePoll: () => void = () => undefined;
    let polls = 0;
    server.use(
      http.post("*/api/expocannabis/orders", () => HttpResponse.json(status("at_terminal"))),
      http.get("*/api/expocannabis/orders/501/status", async () => {
        polls += 1;
        await new Promise<void>((resolve) => {
          releasePoll = resolve;
        });
        return HttpResponse.json(status("at_terminal"));
      }),
      http.post("*/api/expocannabis/orders/501/cancel", () => HttpResponse.json(status("canceled"))),
      http.post("*/api/expocannabis/orders/501/abandon", () => HttpResponse.json({ orderId: 501 })),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: CHARGE }));
    expect(await screen.findByText("Passe o cartão ou leia o Pix na maquininha")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6500);
    });
    expect(polls).toBe(1);

    await user.click(screen.getByRole("button", { name: "Cancelar cobrança" }));
    await user.click(await screen.findByRole("button", { name: "Voltar ao pedido" }));
    expect(await screen.findByLabelText("tela")).toHaveTextContent("2");

    await act(async () => {
      releasePoll();
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(screen.getByLabelText("pedido")).toHaveTextContent("");
  });

  it("falta de estoque na cobrança volta para a loja com uma chave nova", async () => {
    server.use(
      http.post("*/api/expocannabis/orders", () =>
        HttpResponse.json(
          { code: "papelito_event_out_of_stock", message: "Acabou o estoque.", data: { status: 409, products: [{ productId: 200, available: 3 }] } },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: CHARGE }));

    expect(await screen.findByLabelText("tela")).toHaveTextContent("2");
    expect(screen.getByLabelText("chave")).toHaveTextContent("");
  });

  it("cotação mudou mostra o total novo antes de cobrar", async () => {
    server.use(
      http.post("*/api/expocannabis/orders", () =>
        HttpResponse.json(
          { code: "papelito_event_quote_changed", message: "x", data: { status: 409, quote: { ...QUOTE, lines: [], kit: { qty: 0, unit_cents: 0, full_unit_cents: 0, total_cents: 0 }, totalCents: 160000, quoteFingerprint: "novo" } } },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: CHARGE }));

    expect(await screen.findByText(/O valor mudou: agora é R\$\s?1\.600,00/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cobrar R\$\s?1\.600,00 na maquininha/ })).toBeInTheDocument();
  });
});
