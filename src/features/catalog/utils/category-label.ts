/**
 * As abas do catálogo chegam em caixa alta (`buildTabs` aplica `toLocaleUpperCase`) porque as pills
 * da página de produtos são desenhadas assim. A sidebar de filtros usa os mesmos rótulos, mas com
 * capitalização normal — daí a normalização acontecer só na exibição.
 */
export function toCategoryDisplayLabel(label: string): string {
  return label
    .split(" ")
    .map((word) =>
      word
        ? word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1).toLocaleLowerCase("pt-BR")
        : word,
    )
    .join(" ");
}
