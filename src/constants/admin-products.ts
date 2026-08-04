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

export const PRODUCT_IMAGE_ACCEPT =
  "image/webp,image/png,image/jpeg,image/avif,image/gif,.webp,.png,.jpg,.jpeg,.avif,.gif";

export const PRODUCT_ERROR_MESSAGES = {
  load: "Não foi possível carregar produtos.",
  save: "Não foi possível salvar o produto.",
  upload: "Não foi possível enviar imagem.",
  imageTooLarge: "A imagem é grande demais. Envie uma imagem de até 4 MB.",
  createTag: "Não foi possível criar a tag.",
  invalidRegularPrice: "Informe um preço regular válido.",
  invalidSalePrice: "Informe um preço promocional válido ou deixe o campo vazio.",
  missingName: "Informe o nome do produto.",
  missingTagName: "Informe o nome da tag.",
  promotionTagMissing:
    "Tag de promoção não encontrada. Crie ou mantenha uma tag chamada Promoções.",
} as const;

export const PRODUCT_NOTICES = {
  saved: "Produto salvo.",
  coverUpdated: "Imagem principal atualizada.",
  secondaryAdded: "Foto secundária adicionada.",
  tagApplied: "Tag aplicada ao produto. Salve o produto para confirmar.",
  tagCreated: "Tag criada e aplicada ao produto. Salve o produto para confirmar.",
} as const;
