import { formatBRL } from "@/lib/format-currency";

import type { RichTextResolutionContext } from "./context";

export type TokenParamKind = "none" | "promotion-product";
export type TokenIcon = "campaign" | "credit-card" | "package" | "ticket" | "truck";

export type TokenDefinition = {
  configuration: string;
  id: string;
  icon: TokenIcon;
  label: string;
  group: string;
  source: string;
  description: string;
  paramKind: TokenParamKind;
  sampleValue: string;
  resolve: (
    params: Record<string, string> | undefined,
    context: RichTextResolutionContext,
  ) => string | null;
};

function findPromotionProduct(
  params: Record<string, string> | undefined,
  context: RichTextResolutionContext,
) {
  const productId = Number(params?.productId);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return null;
  }

  return context.promotionProducts.find((product) => product.productId === productId) ?? null;
}

const DEFINITIONS: TokenDefinition[] = [
  {
    id: "frete_gratis.minimo",
    label: "Frete grátis cupom",
    group: "Frete grátis",
    icon: "truck",
    description: "Valor mínimo do pedido configurado em Cupons.",
    source: "Mínimo de frete grátis salvo pelo painel administrativo.",
    configuration: "Admin → Cupons → Frete grátis via cupom.",
    paramKind: "none",
    sampleValue: "R$ 99,00",
    resolve: (_params, context) =>
      context.freeShippingMinimumCents === null
        ? null
        : formatBRL(context.freeShippingMinimumCents / 100),
  },
  {
    id: "parcelamento.maximo",
    label: "Máximo de parcelas",
    group: "Parcelamento",
    icon: "credit-card",
    description: "Quantidade máxima de parcelas aceita no checkout.",
    source: "Limite efetivo de parcelamento aplicado pelo checkout.",
    configuration: "Admin → Cupons → Configuração de parcelamento.",
    paramKind: "none",
    sampleValue: "6",
    resolve: (_params, context) =>
      context.installments === null ? null : String(context.installments.max),
  },
  {
    id: "parcelamento.parcela_minima",
    label: "Valor mínimo da parcela",
    group: "Parcelamento",
    icon: "credit-card",
    description: "Valor mínimo de cada parcela aceito no checkout.",
    source: "Valor mínimo por parcela aplicado pelo checkout.",
    configuration: "Admin → Cupons → Configuração de parcelamento.",
    paramKind: "none",
    sampleValue: "R$ 1,00",
    resolve: (_params, context) =>
      context.installments === null
        ? null
        : formatBRL(context.installments.minimumCents / 100),
  },
  {
    id: "promocao.nome",
    label: "Nome da campanha",
    group: "Promoção",
    icon: "campaign",
    description: "Título da campanha relâmpago ativa.",
    source: "Título da campanha relâmpago que está ativa agora.",
    configuration: "Admin → Oferta Relâmpago → Configuração da campanha → Nome da campanha.",
    paramKind: "none",
    sampleValue: "Queima de Estoque",
    resolve: (_params, context) => context.promotion?.title || null,
  },
  {
    id: "promocao.desconto",
    label: "Percentual de desconto",
    group: "Promoção",
    icon: "ticket",
    description: "Desconto da campanha relâmpago ativa, sem o símbolo de porcentagem.",
    source: "Maior percentual de desconto entre os produtos da campanha ativa.",
    configuration: "Admin → Oferta Relâmpago → Configuração da campanha → Desconto da campanha.",
    paramKind: "none",
    sampleValue: "15",
    resolve: (_params, context) =>
      context.promotion && context.promotion.discountPercent > 0
        ? String(context.promotion.discountPercent)
        : null,
  },
  {
    id: "produto.nome",
    label: "Nome do produto",
    group: "Produto em promoção",
    icon: "package",
    description: "Nome atual do produto selecionado.",
    source: "Produto escolhido entre os itens da campanha relâmpago ativa.",
    configuration: "Admin → Oferta Relâmpago → Produtos da campanha.",
    paramKind: "promotion-product",
    sampleValue: "Seda King Size",
    resolve: (params, context) => findPromotionProduct(params, context)?.name ?? null,
  },
  {
    id: "produto.preco_promocional",
    label: "Preço promocional",
    group: "Produto em promoção",
    icon: "ticket",
    description: "Preço atual do produto dentro da campanha.",
    source: "Preço promocional do produto escolhido na campanha ativa.",
    configuration: "Admin → Oferta Relâmpago → Produtos da campanha.",
    paramKind: "promotion-product",
    sampleValue: "R$ 4,90",
    resolve: (params, context) => {
      const product = findPromotionProduct(params, context);
      return product ? formatBRL(product.price) : null;
    },
  },
  {
    id: "produto.desconto",
    label: "Desconto do produto",
    group: "Produto em promoção",
    icon: "ticket",
    description: "Percentual de desconto do produto, sem o símbolo de porcentagem.",
    source: "Percentual aplicado ao produto escolhido na campanha ativa.",
    configuration: "Admin → Oferta Relâmpago → Produtos da campanha.",
    paramKind: "promotion-product",
    sampleValue: "20",
    resolve: (params, context) => {
      const product = findPromotionProduct(params, context);
      return product && product.discount > 0 ? String(product.discount) : null;
    },
  },
];

const DEFINITIONS_BY_ID = new Map(DEFINITIONS.map((definition) => [definition.id, definition]));

export function listTokenDefinitions(): TokenDefinition[] {
  return DEFINITIONS;
}

export function getTokenDefinition(id: string): TokenDefinition | null {
  return DEFINITIONS_BY_ID.get(id) ?? null;
}

export function isKnownToken(id: string): boolean {
  return DEFINITIONS_BY_ID.has(id);
}
