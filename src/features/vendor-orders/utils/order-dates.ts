/**
 * As datas do pedido chegam do WordPress em **duas** convenções, e ler uma pela
 * outra desloca tudo em três horas:
 *
 * - `date_i18n( 'Y-m-d H:i:s' )` — `created_at` e `paid_at` — é hora de São Paulo.
 * - `current_time( 'mysql', true )` — eventos e entrega dos Correios — é UTC.
 *
 * Nenhum texto carrega o fuso, então não existe parse "padrão" seguro: quem lê
 * escolhe. Sem fuso explícito o servidor (UTC) e o navegador interpretavam o
 * mesmo texto como instantes diferentes, e o HTML servido divergia da
 * hidratação.
 */
export const SAO_PAULO = "America/Sao_Paulo";

/** O Brasil não adota horário de verão desde 2019, então o deslocamento é fixo. */
const SAO_PAULO_OFFSET = "-03:00";

const HAS_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/;

function parseWithOffset(value: string, offset: string): Date | null {
  if (!value) return null;

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(HAS_OFFSET.test(normalized) ? normalized : `${normalized}${offset}`);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Data escrita por `date_i18n()`: hora de São Paulo. */
export function parseSiteDate(value: string): Date | null {
  return parseWithOffset(value, SAO_PAULO_OFFSET);
}

/** Data escrita por `current_time( 'mysql', true )`: UTC. */
export function parseUtcDate(value: string): Date | null {
  return parseWithOffset(value, "Z");
}

/** `true` para `YYYY-MM-DD` — dia sem hora, como a data de postagem. */
export function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
