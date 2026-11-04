const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Instante absoluto de uma data do WooCommerce, pronto para `new Date()`.
 *
 * A REST do WooCommerce devolve `date_*` no fuso do site e `date_*_gmt` em UTC, ambos sem
 * sufixo de fuso; o servidor do Next roda em UTC e leria a data local como UTC, adiantando
 * o relógio em 3 h. Prefere o `_gmt` com `Z`; sem ele, devolve a data local como veio.
 */
export function wcInstant(gmt: string | null | undefined, local: string | null | undefined): string {
  const utc = gmt?.trim();

  if (utc) {
    return HAS_TIMEZONE.test(utc) ? utc : `${utc}Z`;
  }

  return local ?? "";
}
