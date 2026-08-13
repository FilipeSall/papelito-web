import type { RichTextDocument } from "@/features/rich-text";

export type BenefitIconType = "emoji" | "svg";

/**
 * Nível da precedência que respondeu pelo produto.
 *
 * `none` não é erro: é o grupo vencedor sem nenhum item exibível, ou a ausência
 * de grupo global ativo. Em ambos os casos a faixa não deve renderizar.
 */
export type ProductBenefitsSource = "product" | "collection" | "category" | "global" | "none";

export type ProductBenefitItem = {
  id: number;
  iconType: BenefitIconType;
  iconEmoji: string;
  iconUrl: string;
  title: string;
  description: string;
  descriptionContent: RichTextDocument | null;
};

export type ProductBenefits = {
  groupId: number;
  source: ProductBenefitsSource;
  items: ProductBenefitItem[];
};

export type AdminBenefitItem = ProductBenefitItem & {
  iconAttachmentId: number;
  sortOrder: number;
  isActive: boolean;
};

export type BenefitGroupTargets = {
  products: number[];
  collections: string[];
  categories: number[];
};

export type AdminBenefitGroup = {
  id: number;
  name: string;
  isGlobal: boolean;
  isActive: boolean;
  items: AdminBenefitItem[];
  targets: BenefitGroupTargets;
};

export type AdminBenefitGroupsSnapshot = {
  groups: AdminBenefitGroup[];
  collections: string[];
  issues: string[];
};

export const EMPTY_PRODUCT_BENEFITS: ProductBenefits = {
  groupId: 0,
  source: "none",
  items: [],
};
