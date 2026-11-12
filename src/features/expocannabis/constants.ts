/** Id fixo do evento no WordPress; as rotas `event/{id}` só aceitam este valor. */
export const EXPOCANNABIS_EVENT_ID = "expocannabis-2026";

/** Rota da página do estande. Só o atalho do painel admin aponta para ela. */
export const EXPOCANNABIS_PATH = "/expocannabis";

/**
 * Janela de venda do estande, cópia de `PAPELITO_EVENT_SALES_DEFAULT_STARTS/ENDS` do WordPress.
 * Serve só para o atalho do admin escolher o que mostrar; quem libera a venda é o WordPress.
 * Se o `wp-config.php` mudar a janela, mude aqui também.
 */
export const EXPOCANNABIS_WINDOW = {
  startsAt: "2026-11-20T00:00:00-03:00",
  endsAt: "2026-11-22T23:59:59-03:00",
} as const;