import type { SelectOption } from "@/types/admin-products-manager";

export const PRODUCT_STATUS_OPTIONS: readonly SelectOption[] = [
  { label: "Todos", value: "" },
  { label: "Publicado", value: "publish" },
  { label: "Rascunho", value: "draft" },
  { label: "Pendente", value: "pending" },
  { label: "Privado", value: "private" },
];

export const PRODUCT_EDIT_STATUS_OPTIONS: readonly SelectOption[] =
  PRODUCT_STATUS_OPTIONS.filter((option) => option.value);

export const DEFAULT_PRODUCT_STATUS = "draft";

export const PUBLISHED_PRODUCT_STATUS = "publish";

export const TAG_PLACEHOLDER_EXAMPLES =
  "ex: vegano, artesanal, sem-glúten, edição-limitada";

export const PROMOTION_TAG_KEYS = new Set([
  "promocoes",
  "promocao",
  "ofertas",
  "oferta",
]);

export const ADMIN_PRODUCTS_API = {
  list: "/api/admin/products",
  detail: (id: number | string) => `/api/admin/products/${id}`,
  media: "/api/admin/products/media",
  tags: "/api/admin/products/tags",
} as const;

export const FRONTEND_PRODUCT_PATH = "/produtos";

export const PRODUCT_ERROR_MESSAGES = {
  load: "Nao foi possivel carregar produtos.",
  save: "Nao foi possivel salvar o produto.",
  upload: "Nao foi possivel enviar imagem.",
  createTag: "Nao foi possivel criar a tag.",
  missingName: "Informe o nome do produto.",
  missingTagName: "Informe o nome da tag.",
  promotionTagMissing:
    "Tag de promocao nao encontrada. Crie ou mantenha uma tag chamada Promocoes.",
} as const;

export const PRODUCT_NOTICES = {
  saved: "Produto salvo.",
  coverUpdated: "Imagem principal atualizada.",
  secondaryAdded: "Foto secundaria adicionada.",
  tagApplied: "Tag ja existente aplicada ao produto.",
  tagCreated: "Tag criada.",
} as const;
