import "server-only";

import { normalizeRichTextDocument } from "@/features/rich-text";
import { wpRest } from "@/lib/server/wp-rest";
import {
  EMPTY_PRODUCT_BENEFITS,
  type BenefitIconType,
  type ProductBenefitItem,
  type ProductBenefits,
  type ProductBenefitsSource,
} from "@/types/product-benefits";

type WpProductBenefitsResponse = {
  groupId?: number;
  source?: string;
  items?: Partial<ProductBenefitItem>[];
};

const SOURCES: ProductBenefitsSource[] = ["product", "collection", "category", "global", "none"];

function toSource(value: unknown): ProductBenefitsSource {
  return SOURCES.includes(value as ProductBenefitsSource)
    ? (value as ProductBenefitsSource)
    : "none";
}

function toIconType(value: unknown): BenefitIconType {
  return "svg" === value ? "svg" : "emoji";
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapItem(item: Partial<ProductBenefitItem> | undefined, index: number) {
  const title = cleanText(item?.title);

  if (!item || title === "") {
    return null;
  }

  const iconType = toIconType(item.iconType);
  const iconEmoji = cleanText(item.iconEmoji);
  const iconUrl = cleanText(item.iconUrl);

  // Sem ícone o item vira duas linhas de texto soltas na faixa. O backend já
  // recusa gravar assim; aqui a checagem cobre payload antigo ou corrompido.
  if (iconType === "emoji" ? iconEmoji === "" : iconUrl === "") {
    return null;
  }

  return {
    id: typeof item.id === "number" ? item.id : index + 1,
    iconType,
    iconEmoji,
    iconUrl,
    title,
    description: cleanText(item.description),
    descriptionContent: normalizeRichTextDocument(item.descriptionContent),
  } satisfies ProductBenefitItem;
}

/**
 * Benefícios já resolvidos pelo WordPress para um produto.
 *
 * A precedência `produto > coleção > categoria > global` roda no backend, que é
 * quem conhece a taxonomia do produto — o frontend só desenha o que recebe.
 *
 * Falha de rede devolve lista vazia, e a faixa some. É deliberado: não existe
 * cópia comercial hardcoded aqui para servir de fallback, senão haveria duas
 * fontes de verdade para o mesmo texto.
 */
export async function getProductBenefits(productId: number | string): Promise<ProductBenefits> {
  const parsedId = Number(productId);

  if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
    return EMPTY_PRODUCT_BENEFITS;
  }

  const result = await wpRest<WpProductBenefitsResponse>(
    `/papelito/v1/products/${parsedId}/benefits`,
    process.env.NODE_ENV === "development"
      ? {}
      : {
          revalidate: 300,
          tags: ["wp:product-benefits", `wp:product-benefits:${parsedId}`],
        },
  );

  if (!result.ok || !Array.isArray(result.data.items)) {
    if (!result.ok && result.status !== 404) {
      console.warn("[product-benefits] Falha ao consultar os benefícios.", result.error.message);
    }

    return EMPTY_PRODUCT_BENEFITS;
  }

  const items = result.data.items
    .map((item, index) => mapItem(item, index))
    .filter((item): item is ProductBenefitItem => item !== null);

  return {
    groupId: typeof result.data.groupId === "number" ? result.data.groupId : 0,
    source: toSource(result.data.source),
    items,
  };
}
