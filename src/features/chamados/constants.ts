export const CHAMADOS_DEFAULT_PER_PAGE = 20;
export const MESSAGE_BODY_MAX_LENGTH = 2000;
export const MESSAGE_POLL_INTERVAL_MS = 15_000;

/**
 * Teto de nós do corpo estruturado, espelhando `PAPELITO_MESSAGE_CONTENT_MAX_NODES` no PHP.
 * O limite da faixa promocional (40) truncaria uma mensagem longa em silêncio.
 */
export const CHAMADO_BODY_MAX_NODES = 100;
