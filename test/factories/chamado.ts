export const CHAMADO_ABERTO_ID = 7;
export const CHAMADO_ENCERRADO_ID = 8;
export const CHAMADO_CLOSE_FORBIDDEN_ID = 9;
export const CHAMADO_CLOSE_ALLOWED_ID = 10;
export const CHAMADO_SEM_WHATSAPP_ID = 11;
export const CHAMADO_VISTA_VENDOR_ID = 12;
export const CHAMADO_COM_DEVOLUCAO_ID = 13;
export const CHAMADO_INICIAR_DEVOLUCAO_ID = 14;
export const CHAMADO_ESTORNO_CONCLUIDO_ID = 15;
export const CHAMADO_ORDER_ID = 14094;
export const VENDOR_SEM_TELEFONE_ORDER_ID = 15000;

type Overrides = Record<string, unknown>;

export function wpChamadoMessage(overrides: Overrides = {}) {
  return {
    body: "A entrega não chegou.",
    content: null,
    created_at: "2026-09-02 12:00:00",
    id: 1,
    is_mine: false,
    sender_id: 17,
    sender_name: "Ana Compradora",
    sender_role: "customer",
    ...overrides,
  };
}

export function wpChamadoOrder(overrides: Overrides = {}) {
  return {
    created_at: "2026-09-01T10:00:00-03:00",
    id: CHAMADO_ORDER_ID,
    items: [
      { id: "42", line_total: 30, name: "Caderno Pautado", quantity: 2 },
      { id: "43", line_total: 12, name: "Caneta Azul", quantity: 3 },
    ],
    items_total_count: 5,
    number: "14094",
    payment_method_label: "Cartão de crédito",
    shipping: 12,
    status: "processing",
    status_label: "Processando",
    store_id: 29,
    store_label: "Papeloto",
    subtotal: 42,
    total: 54,
    ...overrides,
  };
}

export function wpChamado(overrides: Overrides = {}) {
  return {
    capabilities: {
      can_close: false,
      can_escalate: true,
      can_reply: true,
      can_start_return: false,
    },
    closed_at: null,
    closed_by_name: null,
    context: "order",
    counterpart_name: "Papeloto",
    escalated_at: null,
    is_chamado: true,
    last_message: wpChamadoMessage(),
    messages: [wpChamadoMessage()],
    opened_at: "2026-09-02 12:00:00",
    order: wpChamadoOrder(),
    order_id: CHAMADO_ORDER_ID,
    order_number: "14094",
    participants: {
      customer: { id: 17, name: "Ana Compradora" },
      seller: {
        id: 29,
        name: "Papeloto",
        whatsapp_url: "https://wa.me/5561999733064?text=Ol%C3%A1%21",
      },
    },
    reason: "atraso_entrega",
    reason_label: "Atraso na entrega",
    reason_other: null,
    return_reason: null,
    return_request: null,
    status: "ABERTO",
    thread_id: CHAMADO_ABERTO_ID,
    unread_count: 0,
    updated_at: "2026-09-02 12:00:00",
    viewer_role: "customer",
    ...overrides,
  };
}
