import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Invalida tudo que depende de uma configuração de benefícios.
 *
 * A faixa aparece em toda página de produto, e não há como enumerar as rotas —
 * por isso a invalidação é pela tag `wp:product-benefits`, que o fetch de
 * `getProductBenefits` carrega, e não por `revalidatePath` produto a produto.
 */
export function invalidateBenefits() {
  revalidateTag("admin-benefit-groups", "max");
  revalidateTag("wp:product-benefits", "max");
  revalidatePath("/admin/assets");
}
