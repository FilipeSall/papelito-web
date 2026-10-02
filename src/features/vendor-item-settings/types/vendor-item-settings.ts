/**
 * Teto do código do vendor, em caracteres Unicode, igual ao `PAPELITO_VENDOR_CODE_MAX_LENGTH` do WordPress.
 * É só experiência: quem recusa de verdade é o backend.
 */
export const VENDOR_CODE_MAX_LENGTH = 60;

/**
 * Atributos privados do vendor para um item vendável (produto, variação ou kit).
 * O código é o que o vendor usa no próprio ERP; nunca substitui o SKU da Papelito.
 */
export interface VendorItemSettings {
  /** Item da linha de estoque; variação não sobe para o pai. */
  productId: number;
  /** `null` quando o vendor não associou código. */
  vendorCode: string | null;
  updatedAt: string | null;
}

/** Item cujo código o editor de produto pode alterar, com o que a tela já sabe dele. */
export interface VendorCodeTarget {
  /** Produto ou variação da linha, diferente do pai que guarda a descrição. */
  itemId: number;
  initialCode: string | null;
  /**
   * SKU da Papelito, usado como reserva: preenche o campo quando o vendor não tem código próprio.
   * A tela nunca o rotula como da Papelito — para o vendor existe um SKU só.
   */
  sku: string;
  /** Verdadeiro quando a linha é variação: o código não vale para as irmãs. */
  isVariation: boolean;
  /** Falso quando o WordPress ainda não tem o schema do código. */
  available: boolean;
}
