import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  VendorOrderDeliveryCountdown,
  computeDeliveryCountdown,
} from "./vendor-order-delivery-countdown";

const DAY = 24 * 60 * 60 * 1000;
const PAID = "2026-06-01 12:00:00";
// Mesma convenção do componente: `paid_at` é hora de São Paulo. Medir a partir
// de outra baseline faria "3/4 restantes" significar outra coisa.
const paidTs = new Date("2026-06-01T12:00:00-03:00").getTime();

function compute(overrides: Partial<Parameters<typeof computeDeliveryCountdown>[0]> = {}) {
  return computeDeliveryCountdown({
    status: "aguardando_envio",
    paidAt: PAID,
    deliveryTimeDays: 4,
    now: paidTs,
    ...overrides,
  });
}

describe("computeDeliveryCountdown", () => {
  it("is neutral (preto) while more than half the window remains", () => {
    const result = compute({ now: paidTs + 1 * DAY }); // 3/4 left
    expect(result).toMatchObject({ kind: "remaining", tone: "neutral" });
  });

  it("turns warning (amarelo) once half or less remains", () => {
    const result = compute({ now: paidTs + 2.4 * DAY }); // ~0.4 left
    expect(result).toMatchObject({ kind: "remaining", tone: "warning" });
  });

  it("turns critical (vermelho) once a quarter or less remains", () => {
    const result = compute({ now: paidTs + 3.2 * DAY }); // ~0.2 left
    expect(result).toMatchObject({ kind: "remaining", tone: "critical" });
  });

  // O fuso da máquina precisa ser fixado: numa máquina em Brasília o parse
  // ingênuo coincide com o correto, e o teste não distinguiria nada. Em UTC —
  // que é o do servidor onde a página é renderizada — os dois divergem.
  describe("com o servidor em UTC", () => {
    const originalTz = process.env.TZ;

    beforeAll(() => {
      process.env.TZ = "UTC";
    });

    afterAll(() => {
      process.env.TZ = originalTz;
    });

    it("conta o prazo a partir da hora de São Paulo, não do fuso de quem executa (regressão)", () => {
      // Pago 01/06 12:00 em São Paulo = 15:00Z. Com 1 dia de prazo, o limite é
      // 02/06 15:00Z — às 12:00Z ainda restam 3h. Lido como UTC, o prazo já
      // teria vencido, e servidor e navegador discordariam do mesmo pedido.
      const result = computeDeliveryCountdown({
        status: "aguardando_envio",
        paidAt: "2026-06-01 12:00:00",
        deliveryTimeDays: 1,
        now: Date.parse("2026-06-02T12:00:00Z"),
      });

      expect(result.kind).toBe("remaining");
    });
  });

  it("reports overdue once the deadline passes", () => {
    const result = compute({ now: paidTs + 5 * DAY });
    expect(result.kind).toBe("overdue");
  });

  it("marks the counter done once shipped or delivered (carrier's responsibility now)", () => {
    expect(compute({ status: "enviado" }).kind).toBe("done");
    expect(compute({ status: "entregue" }).kind).toBe("done");
  });

  it("does not report overdue after the order is shipped", () => {
    // even way past the deadline, a shipped order is the carrier's job, not the vendor's
    expect(compute({ status: "enviado", now: paidTs + 99 * DAY }).kind).toBe("done");
  });

  it("hides the counter for a cancelled order", () => {
    expect(compute({ status: "cancelado" }).kind).toBe("hidden");
  });

  it("hides the counter while a paid order awaits stock review", () => {
    expect(compute({ status: "aguardando_estoque" }).kind).toBe("hidden");
  });

  it("hides when there is no delivery estimate or no start date", () => {
    expect(compute({ deliveryTimeDays: 0 }).kind).toBe("hidden");
    expect(compute({ paidAt: "" }).kind).toBe("pending_payment");
  });

  it("waits for paidAt instead of falling back to createdAt", () => {
    const result = compute({ paidAt: "", now: paidTs + 1 * DAY });
    expect(result.kind).toBe("pending_payment");
  });
});

describe("VendorOrderDeliveryCountdown", () => {
  it("renders the remaining label", () => {
    render(
      <VendorOrderDeliveryCountdown
        deliveryTimeDays={4}
        now={paidTs + 1 * DAY}
        paidAt={PAID}
        status="aguardando_envio"
      />,
    );
    expect(screen.getByText(/restantes/i)).toBeInTheDocument();
    expect(screen.getByText(/tempo para entregar/i)).toBeInTheDocument();
  });

  it("renders nothing for a cancelled order", () => {
    const { container } = render(
      <VendorOrderDeliveryCountdown
        deliveryTimeDays={4}
        now={paidTs}
        paidAt={PAID}
        status="cancelado"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows Concluido once the order is shipped", () => {
    render(
      <VendorOrderDeliveryCountdown
        deliveryTimeDays={4}
        now={paidTs + 99 * DAY}
        paidAt={PAID}
        status="enviado"
      />,
    );
    expect(screen.getByText("Concluido")).toBeInTheDocument();
  });

  it("shows aguardando pagamento while payment is not confirmed", () => {
    render(
      <VendorOrderDeliveryCountdown
        deliveryTimeDays={4}
        now={paidTs}
        paidAt=""
        status="aguardando_pagamento"
      />,
    );
    expect(screen.getByText("Aguardando pagamento")).toBeInTheDocument();
    expect(screen.getByText("Pagamento")).toBeInTheDocument();
  });
});
