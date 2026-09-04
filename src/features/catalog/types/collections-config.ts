export type NewArrivalsConfig = {
  limit: number;
  /** Dias de validade. `0` significa sem prazo, que é o padrão. */
  expirationDays: number;
};

export type PromotionsConfig = {
  /** Teto do pool. `0` significa sem teto. */
  limit: number;
};

export type CollectionsConfig = {
  newArrivals: NewArrivalsConfig;
  promotions: PromotionsConfig;
};

/**
 * Limites espelhados de `collections_config.php`.
 *
 * Vivem fora do serviço porque o painel é componente de cliente e o serviço é `server-only`:
 * importar a constante de lá arrastaria o módulo de servidor para o bundle do navegador.
 */
export const COLLECTIONS_CONFIG_MAX_LIMIT = 60;
export const COLLECTIONS_CONFIG_MAX_EXPIRATION_DAYS = 365;

/**
 * Padrão usado quando o WordPress não responde.
 *
 * A vitrine não pode cair porque a configuração não chegou, e o valor tem de ser o mesmo que o
 * backend aplica na ausência de option gravada.
 */
export const DEFAULT_COLLECTIONS_CONFIG: CollectionsConfig = {
  newArrivals: { limit: 10, expirationDays: 0 },
  promotions: { limit: 0 },
};
