import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Invalida o que depende do catálogo de brindes.
 *
 * Criar não toca em Kit nenhum, e excluir só passa quando o brinde não é usado —
 * nesses casos o cache de Kits está correto e derrubá-lo seria desperdício. A
 * edição é a única que muda peso, dimensão, nome ou imagem dentro de Kits já
 * montados, e aí a lista administrativa, a pública e a rota `/kits` saem junto.
 */
export function invalidateMerchandise({ affectsKits = false } = {}) {
  revalidateTag("admin-merchandise", "max");

  if (!affectsKits) return;

  revalidateTag("admin-kits", "max");
  revalidateTag("wp:kits", "max");
  revalidatePath("/kits");
}
