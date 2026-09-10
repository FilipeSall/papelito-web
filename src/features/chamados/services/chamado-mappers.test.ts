import { describe, expect, it } from "vitest";

import {
  wpChamado,
  wpChamadoMessage,
} from "../../../../test/factories/chamado";

import { mapChamado, mapChamadoSummary } from "./chamado-mappers";

describe("chamado mappers", () => {
  it("liga o chamado ao pedido, ao cliente e à loja", () => {
    const chamado = mapChamado(wpChamado());

    expect(chamado.orderId).toBe(14094);
    expect(chamado.orderNumber).toBe("14094");
    expect(chamado.order?.number).toBe("14094");
    expect(chamado.participants.customer).toMatchObject({
      id: 17,
      name: "Ana Compradora",
    });
    expect(chamado.participants.seller).toMatchObject({
      id: 29,
      name: "Papeloto",
    });
  });

  it("traz motivo, situação e encerramento", () => {
    const chamado = mapChamado(
      wpChamado({
        closed_at: "2026-09-05 08:00:00",
        closed_by_name: "Papeloto",
        reason: "devolucao",
        reason_label: "Solicitação de devolução",
        return_reason: "defective",
        status: "ENCERRADO",
      }),
    );

    expect(chamado.status).toBe("encerrado");
    expect(chamado.reason).toBe("devolucao");
    expect(chamado.reasonLabel).toBe("Solicitação de devolução");
    expect(chamado.returnReason).toBe("defective");
    expect(chamado.closedByName).toBe("Papeloto");
  });

  it("contexto desconhecido vira null em vez de virar pedido", () => {
    expect(mapChamadoSummary({ context: "assunto_novo" }).context).toBeNull();
    expect(mapChamadoSummary({ context: "order" }).context).toBe("order");
    expect(
      mapChamadoSummary({ context: "pagarme_bank_account_update" }).context,
    ).toBe("pagarme_bank_account_update");
  });

  it("situação desconhecida é fail-closed", () => {
    expect(mapChamadoSummary({ status: "EM_ANALISE" }).status).toBe(
      "encerrado",
    );
    expect(mapChamadoSummary({}).status).toBe("encerrado");
    expect(mapChamadoSummary({ status: "aberto" }).status).toBe("aberto");
  });

  it("capacidades só são verdadeiras quando o backend disser", () => {
    expect(
      mapChamado(wpChamado({ capabilities: undefined })).capabilities,
    ).toEqual({
      canClose: false,
      canEscalate: false,
      canReply: false,
      canStartReturn: false,
    });
  });

  it("preserva o corpo estruturado e a projeção plana", () => {
    const message = mapChamado(
      wpChamado({
        messages: [
          wpChamadoMessage({
            body: "Motivo: Produto com defeito",
            content: [
              { type: "text", text: "Motivo: ", bold: true },
              { type: "text", text: "Produto com defeito" },
            ],
          }),
        ],
      }),
    ).messages[0];

    expect(message.plainText).toBe("Motivo: Produto com defeito");
    expect(message.content).toEqual([
      { type: "text", text: "Motivo: ", bold: true },
      { type: "text", text: "Produto com defeito" },
    ]);
  });

  it("conteúdo inválido degrada para texto plano em vez de quebrar", () => {
    const message = mapChamado(
      wpChamado({ messages: [wpChamadoMessage({ content: "não é lista" })] }),
    ).messages[0];

    expect(message.content).toBeNull();
    expect(message.plainText).toBe("A entrega não chegou.");
  });

  it("whatsapp só existe quando o backend manda a chave", () => {
    expect(mapChamado(wpChamado()).participants.seller.whatsappUrl).toBe(
      "https://wa.me/5561999733064?text=Ol%C3%A1%21",
    );

    const semChave = mapChamado(
      wpChamado({
        participants: {
          customer: { id: 17, name: "Ana" },
          seller: { id: 29, name: "Papeloto" },
        },
      }),
    );
    expect("whatsappUrl" in semChave.participants.seller).toBe(false);

    const semTelefone = mapChamado(
      wpChamado({
        participants: {
          customer: { id: 17, name: "Ana" },
          seller: { id: 29, name: "Papeloto", whatsapp_url: null },
        },
      }),
    );
    expect(semTelefone.participants.seller.whatsappUrl).toBeNull();
  });
});
