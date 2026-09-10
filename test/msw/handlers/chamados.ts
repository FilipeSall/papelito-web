import { HttpResponse, http } from "msw";

import {
  CHAMADO_ABERTO_ID,
  CHAMADO_CLOSE_ALLOWED_ID,
  CHAMADO_COM_DEVOLUCAO_ID,
  CHAMADO_ESTORNO_CONCLUIDO_ID,
  CHAMADO_INICIAR_DEVOLUCAO_ID,
  CHAMADO_CLOSE_FORBIDDEN_ID,
  CHAMADO_ENCERRADO_ID,
  CHAMADO_SEM_WHATSAPP_ID,
  CHAMADO_VISTA_VENDOR_ID,
  VENDOR_SEM_TELEFONE_ORDER_ID,
  wpChamado,
} from "../../factories/chamado";

const WP_REST_BASE = "http://localhost:8080/wp-json";

const REASONS = {
  reasons: [
    {
      label: "Dúvida sobre o pedido",
      requires_detail: false,
      requires_return_reason: false,
      value: "duvida_pedido",
    },
    {
      label: "Atraso na entrega",
      requires_detail: false,
      requires_return_reason: false,
      value: "atraso_entrega",
    },
    {
      label: "Solicitação de devolução",
      requires_detail: false,
      requires_return_reason: true,
      value: "devolucao",
    },
    {
      label: "Outro assunto",
      requires_detail: true,
      requires_return_reason: false,
      value: "outro",
    },
  ],
  return_reasons: [
    { label: "Desistência da compra", requires_detail: false, value: "regret" },
    {
      label: "Produto com defeito",
      requires_detail: false,
      value: "defective",
    },
    { label: "Outro motivo", requires_detail: true, value: "other" },
  ],
};

/**
 * Mensagens enviadas durante o teste.
 *
 * O backend de verdade devolve a conversa inteira em toda leitura; sem guardar aqui, o `PUT /read`
 * do fixture apagaria a mensagem recém-enviada e o teste mediria o dublê, não o componente.
 */
const sentMessages = new Map<number, Record<string, unknown>[]>();

export function resetChamadosState() {
  sentMessages.clear();
}

function chamadoById(id: number) {
  const base = baseChamadoById(id);
  const extra = sentMessages.get(id) ?? [];

  return extra.length === 0
    ? base
    : {
        ...base,
        last_message: extra[extra.length - 1],
        messages: [...base.messages, ...extra],
      };
}

function baseChamadoById(id: number) {
  if (id === CHAMADO_ENCERRADO_ID) {
    return wpChamado({
      capabilities: { can_close: false, can_escalate: false, can_reply: false },
      closed_at: "2026-09-05 08:00:00",
      closed_by_name: "Papeloto",
      status: "ENCERRADO",
      thread_id: CHAMADO_ENCERRADO_ID,
    });
  }

  if (id === CHAMADO_CLOSE_FORBIDDEN_ID || id === CHAMADO_CLOSE_ALLOWED_ID) {
    return wpChamado({
      capabilities: { can_close: true, can_escalate: false, can_reply: true },
      participants: {
        customer: { id: 17, name: "Ana Compradora" },
        seller: { id: 29, name: "Papeloto" },
      },
      thread_id: id,
      viewer_role: "seller",
    });
  }

  // Loja sem telefone cadastrado: o backend manda a chave presente e nula.
  if (id === CHAMADO_SEM_WHATSAPP_ID) {
    return wpChamado({
      participants: {
        customer: { id: 17, name: "Ana Compradora" },
        seller: { id: 29, name: "Papeloto", whatsapp_url: null },
      },
      thread_id: id,
    });
  }

  // O próprio vendor não recebe a chave: o backend nem a emite para ele.
  if (id === CHAMADO_VISTA_VENDOR_ID) {
    return wpChamado({
      participants: {
        customer: { id: 17, name: "Ana Compradora" },
        seller: { id: 29, name: "Papeloto" },
      },
      thread_id: id,
      viewer_role: "seller",
    });
  }

  // Chamado de devolução já formalizada pelo vendor: o registro reverso existe.
  if (id === CHAMADO_COM_DEVOLUCAO_ID) {
    return wpChamado({
      reason: "devolucao",
      reason_label: "Solicitação de devolução",
      return_reason: "defective",
      return_request: { id: 55, status: "awaiting_reverse_authorization" },
      thread_id: id,
    });
  }

  if (id === CHAMADO_INICIAR_DEVOLUCAO_ID) {
    return wpChamado({
      capabilities: {
        can_close: true,
        can_escalate: false,
        can_reply: true,
        can_start_return: true,
      },
      reason: "devolucao",
      reason_label: "Solicitação de devolução",
      return_reason: "defective",
      thread_id: id,
      viewer_role: "seller",
    });
  }

  if (id === CHAMADO_ESTORNO_CONCLUIDO_ID) {
    return wpChamado({
      reason: "devolucao",
      reason_label: "Solicitação de devolução",
      return_request: { id: 55, status: "refunded" },
      thread_id: id,
    });
  }

  return wpChamado({ thread_id: id });
}

export const chamadosHandlers = [
  http.get(`${WP_REST_BASE}/papelito/v1/messages/chamado-reasons`, () =>
    HttpResponse.json(REASONS),
  ),
  http.get("/api/messages/chamado-reasons", () => HttpResponse.json(REASONS)),

  http.get(`${WP_REST_BASE}/papelito/v1/messages/threads`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const items =
      params.get("status") === "ENCERRADO"
        ? [chamadoById(CHAMADO_ENCERRADO_ID)]
        : [chamadoById(CHAMADO_ABERTO_ID), chamadoById(CHAMADO_ENCERRADO_ID)];

    return HttpResponse.json({
      items,
      page: 1,
      per_page: 20,
      total: items.length,
      total_pages: 1,
    });
  }),

  http.get(`${WP_REST_BASE}/papelito/v1/messages/threads/:id`, ({ params }) =>
    HttpResponse.json(chamadoById(Number(params.id))),
  ),
  http.get("/api/messages/threads/:id", ({ params }) =>
    HttpResponse.json(chamadoById(Number(params.id))),
  ),

  http.post("/api/messages/threads/:id", async ({ params, request }) => {
    const body = (await request.json().catch(() => null)) as {
      body?: string;
      content?: unknown;
    } | null;
    const id = Number(params.id);

    if (id === CHAMADO_ENCERRADO_ID) {
      return HttpResponse.json(
        {
          code: "papelito_message_thread_closed",
          message: "Este chamado foi encerrado.",
        },
        { status: 409 },
      );
    }

    const extra = sentMessages.get(id) ?? [];
    extra.push({
      body: body?.body ?? "",
      content: body?.content ?? null,
      created_at: "2026-09-03 09:00:00",
      id: 100 + extra.length,
      is_mine: true,
      sender_id: 17,
      sender_name: "Ana Compradora",
      sender_role: "customer",
    });
    sentMessages.set(id, extra);

    return HttpResponse.json(chamadoById(id), { status: 201 });
  }),

  http.put("/api/messages/threads/:id/read", ({ params }) =>
    HttpResponse.json(chamadoById(Number(params.id))),
  ),

  http.post("/api/messages/threads/:id/escalate", ({ params }) =>
    HttpResponse.json({
      ...chamadoById(Number(params.id)),
      escalated_at: "2026-09-03 10:00:00",
    }),
  ),

  http.post("/api/messages/threads/:id/close", ({ params }) => {
    const id = Number(params.id);

    if (id === CHAMADO_CLOSE_FORBIDDEN_ID) {
      return HttpResponse.json(
        {
          code: "papelito_message_close_forbidden",
          message: "Somente a loja ou a Papelito podem encerrar o chamado.",
        },
        { status: 403 },
      );
    }

    return HttpResponse.json({
      ...chamadoById(id),
      capabilities: { can_close: false, can_escalate: false, can_reply: false },
      closed_at: "2026-09-06 11:00:00",
      closed_by_name: "Papeloto",
      status: "ENCERRADO",
    });
  }),

  http.post("/api/messages/threads", async ({ request }) => {
    const body = (await request.json().catch(() => null)) as {
      order_id?: number;
      reason?: string;
      return_reason?: string;
    } | null;

    if (!body?.reason) {
      return HttpResponse.json(
        {
          code: "papelito_message_reason_invalid",
          message: "Escolha um motivo para o chamado.",
        },
        { status: 422 },
      );
    }

    // Segundo chamado aberto com o mesmo motivo: o backend recusa e diz qual já existe.
    if (body.reason === "atraso_entrega") {
      return HttpResponse.json(
        {
          code: "papelito_message_chamado_open_exists",
          data: { status: 409, thread_id: CHAMADO_ABERTO_ID },
          message: "Já existe um chamado aberto deste pedido com esse motivo.",
        },
        { status: 409 },
      );
    }

    return HttpResponse.json(
      wpChamado({
        order_id: body.order_id ?? 0,
        reason: body.reason,
        return_reason: body.return_reason ?? null,
        thread_id: 77,
      }),
      { status: 201 },
    );
  }),

  http.post("/api/messages/return-support", async ({ request }) => {
    const body = (await request.json().catch(() => null)) as {
      orderId?: number;
      reason?: string;
      reasonOther?: string;
    } | null;

    if (!body?.reason) {
      return HttpResponse.json(
        {
          code: "papelito_return_reason_invalid",
          message: "Informe um motivo para a devolução.",
        },
        { status: 422 },
      );
    }

    return HttpResponse.json(
      wpChamado({
        order_id: body.orderId ?? 0,
        reason: "devolucao",
        reason_label: "Solicitação de devolução",
        return_reason: body.reason,
        participants:
          body.orderId === VENDOR_SEM_TELEFONE_ORDER_ID
            ? {
                customer: { id: 17, name: "Ana Compradora" },
                seller: { id: 29, name: "Papeloto", whatsapp_url: null },
              }
            : wpChamado().participants,
      }),
      { status: 201 },
    );
  }),
];
