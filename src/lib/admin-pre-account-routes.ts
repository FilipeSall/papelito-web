const PRE_ACCOUNT_APPLICATIONS_PATH = "/admin/contas/candidatura";
const ACCOUNTS_LIST_PATH = "/admin/contas";
const PRE_ACCOUNT_EXTERNAL_ID = /^(?:pre:)?(\d+)$/;

/**
 * Converte o id da candidatura pré-conta, externo (`pre:9`) ou só o número, no inteiro do backend.
 * Devolve `0` para qualquer coisa fora desse formato, o que a rota trata como página inexistente.
 */
export function parsePreAccountApplicationId(value: string | number | undefined): number {
  const match = PRE_ACCOUNT_EXTERNAL_ID.exec(String(value ?? "").trim());
  return match ? Number.parseInt(match[1], 10) : 0;
}

/**
 * Endereço da página onde o admin aprova ou reprova uma candidatura pré-conta.
 * `fromQuery` é a query da listagem de origem, devolvida pelo "Voltar" sem perder filtro ou aba.
 *
 * @example preAccountApplicationHref("pre:9", "tab=analises") // "/admin/contas/candidatura/9?from=tab%3Danalises"
 */
export function preAccountApplicationHref(applicationId: string | number, fromQuery?: string): string {
  const href = `${PRE_ACCOUNT_APPLICATIONS_PATH}/${parsePreAccountApplicationId(applicationId)}`;
  if (!fromQuery) return href;

  return `${href}?${new URLSearchParams({ from: fromQuery }).toString()}`;
}

/**
 * Volta da página da candidatura para a listagem de contas, reaplicando a query de origem.
 * A query é re-serializada e o caminho é fixo, então o parâmetro nunca vira redirecionamento aberto.
 */
export function preAccountApplicationBackHref(fromQuery: string | undefined): string {
  const query = new URLSearchParams(fromQuery ?? "").toString();
  return query ? `${ACCOUNTS_LIST_PATH}?${query}` : ACCOUNTS_LIST_PATH;
}
