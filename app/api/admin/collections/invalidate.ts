import { revalidatePath, revalidateTag } from "next/cache";

/**
 * O catálogo de coleções alimenta o painel, o seletor do editor de produto e o
 * recorte de `/catalog/search?collection=`. Arquivar uma coleção esvazia esse
 * recorte, então a tag do catálogo público entra junto.
 */
export function invalidateCollections() {
  revalidateTag("admin-taxonomy", "max");
  revalidateTag("wp:categories", "max");
  revalidateTag("wp:products", "max");
  revalidatePath("/premium");
  revalidatePath("/colecoes");
}
