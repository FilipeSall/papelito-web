import { describe, expect, it } from "vitest";

import { SHIPMENT_LOGISTICS_STATUSES } from "@/features/vendor-orders/types/vendor-orders";

import { logisticsHeadline, logisticsStatusLabel, vendorOrderNextAction } from "./order-status";

const CORREIOS_VOCABULARY = /correios|objeto|pré-postagem|etiqueta/i;

describe("logisticsStatusLabel", () => {
  it("never puts Correios vocabulary in front of a Braspress order", () => {
    for (const status of [...SHIPMENT_LOGISTICS_STATUSES, "not_started" as const]) {
      expect(logisticsStatusLabel(status, "braspress")).not.toMatch(CORREIOS_VOCABULARY);
    }
  });

  it("names Braspress in the sentences that already named a transportadora", () => {
    expect(logisticsStatusLabel("delivered", "braspress")).toBe("Entrega confirmada pela Braspress");
    expect(logisticsStatusLabel("tracking_pending", "braspress")).toBe(
      "Aguardando eventos da Braspress",
    );
  });

  it("keeps pré-postagem and etiqueta for Correios, where they exist", () => {
    expect(logisticsStatusLabel("preposted", "correios")).toBe("Etiqueta gerada; aguardando postagem");
    expect(logisticsStatusLabel("cancelled", "correios")).toBe("Pré-postagem cancelada");
    expect(logisticsStatusLabel("expired", "correios")).toBe("Pré-postagem expirada");
    expect(logisticsStatusLabel("not_started", "correios")).toBe("Aguardando geração da etiqueta");
    expect(logisticsStatusLabel("delivered", "correios")).toBe("Entrega confirmada pelos Correios");
  });

  it("does not describe a pré-postagem the Braspress never issues", () => {
    expect(logisticsStatusLabel("preposted", "braspress")).toBe("Envio registrado; aguardando postagem");
    expect(logisticsStatusLabel("cancelled", "braspress")).toBe("Envio cancelado");
    expect(logisticsStatusLabel("expired", "braspress")).toBe("Envio expirado");
    expect(logisticsStatusLabel("not_started", "braspress")).toBe("Sem postagem registrada");
  });

  it("drops 'objeto', which is a Correios word, from the labels shared by both", () => {
    expect(logisticsStatusLabel("posted", "correios")).toBe("Encomenda postada");
    expect(logisticsStatusLabel("in_transit", "correios")).toBe("Encomenda em trânsito");
    expect(logisticsStatusLabel("out_for_delivery", "correios")).toBe("Encomenda saiu para entrega");
    expect(logisticsStatusLabel("pickup_available", "correios")).toBe(
      "Encomenda disponível para retirada",
    );
    expect(logisticsStatusLabel("returning", "correios")).toBe("Encomenda em devolução");
    expect(logisticsStatusLabel("returned", "correios")).toBe("Encomenda devolvida ao remetente");
  });

  it("reads a shipment without provider as Correios, the only transportadora it could have had", () => {
    expect(logisticsStatusLabel("delivered")).toBe("Entrega confirmada pelos Correios");
    expect(logisticsStatusLabel("delivered", "manual")).toBe("Entrega confirmada pelos Correios");
  });
});

describe("vendorOrderNextAction", () => {
  it("names the transportadora the vendor is waiting on", () => {
    expect(vendorOrderNextAction("enviado", "braspress")).toBe("Acompanhando a Braspress");
    expect(vendorOrderNextAction("enviado", "correios")).toBe("Acompanhando os Correios");
    expect(vendorOrderNextAction("enviado")).toBe("Acompanhando os Correios");
  });

  it("leaves the actions that do not depend on the transportadora alone", () => {
    expect(vendorOrderNextAction("aguardando_envio", "braspress")).toBe("Separar o pedido");
    expect(vendorOrderNextAction("em_separacao", "braspress")).toBe("Postar e informar o rastreio");
  });
});

describe("logisticsHeadline", () => {
  it("does not make a Braspress order wait for a label the Papelito never generates", () => {
    expect(logisticsHeadline("not_started", "not_started", true, "braspress")).toBe(
      "Sem postagem registrada",
    );
  });

  it("keeps the Correios order waiting for the label while generation is automatic", () => {
    expect(logisticsHeadline("not_started", "not_started", true, "correios")).toBe(
      "Aguardando geração da etiqueta",
    );
  });

  it("reports the logistics event by the transportadora of the order", () => {
    expect(logisticsHeadline("generated", "posted", true, "braspress")).toBe("Encomenda postada");
    expect(logisticsHeadline("generated", "delivered", true, "braspress")).toBe(
      "Entrega confirmada pela Braspress",
    );
  });
});
