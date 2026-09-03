import {
  CircleDashed,
  FileWarning,
  Images,
  PackageCheck,
  PackageX,
  Ruler,
  Tag,
  TriangleAlert,
  Weight,
  type LucideIcon,
} from "lucide-react";

import type {
  VendorStockLevel,
  VendorStockMissingField,
} from "@/features/vendor-stock/types/vendor-stock";
import type { StatusShape } from "@/components/layout/operational-panel";

/**
 * Vocabulário de situação do estoque.
 *
 * Cada nível é ícone **mais** texto: o painel do vendor é lido em pressa, muitas vezes impresso
 * ou conferido no balcão, e a cor sozinha some nesses dois casos.
 */
const LEVEL: Record<VendorStockLevel, StatusShape> = {
  available: { icon: PackageCheck, label: "Em estoque", tone: "positive" },
  low: { icon: TriangleAlert, label: "Estoque baixo", tone: "pending" },
  out: { icon: PackageX, label: "Sem estoque", tone: "critical" },
  unconfigured: { icon: CircleDashed, label: "Não configurado", tone: "neutral" },
};

export function stockLevelShape(level: VendorStockLevel): StatusShape {
  return LEVEL[level];
}

const FIELD_LABEL: Record<VendorStockMissingField, string> = {
  category: "categoria",
  dimensions: "dimensões",
  image: "imagem",
  price: "preço",
  weight: "peso",
};

const FIELD_ICON: Record<VendorStockMissingField, LucideIcon> = {
  category: Tag,
  dimensions: Ruler,
  image: Images,
  price: FileWarning,
  weight: Weight,
};

export function missingFieldLabel(field: VendorStockMissingField): string {
  return FIELD_LABEL[field];
}

export function missingFieldIcon(field: VendorStockMissingField): LucideIcon {
  return FIELD_ICON[field];
}

/**
 * Enumera os campos ausentes em português: "imagem", "imagem e peso", "imagem, peso e dimensões".
 *
 * Existe para a linha dizer exatamente o que falta em vez de um "dados incompletos" genérico, que
 * obrigaria o vendor a abrir o produto para descobrir.
 */
export function describeMissingFields(fields: VendorStockMissingField[]): string {
  const labels = fields.map(missingFieldLabel);

  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];

  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}`;
}

/**
 * Texto do WhatsApp para o vendor pedir o cadastro que falta.
 *
 * O telefone nunca vem daqui: quem o fornece é a configuração de atendimento em `/admin/config`.
 */
export function buildWhatsappMessage(
  productName: string,
  fields: VendorStockMissingField[],
): string {
  return `Olá! Tenho estoque de "${productName}", mas o cadastro está sem ${describeMissingFields(fields)}. Conseguem atualizar para mim?`;
}

/**
 * Link de conversa com o texto já preenchido, ou `null` quando não há telefone configurado.
 *
 * Devolver `null` é deliberado: um `wa.me` sem número abriria o WhatsApp em branco e o vendor
 * concluiria que o pedido foi enviado.
 */
export function buildWhatsappHref(
  phone: string,
  productName: string,
  fields: VendorStockMissingField[],
): string | null {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10) {
    return null;
  }

  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;

  return `https://wa.me/${withCountry}?text=${encodeURIComponent(buildWhatsappMessage(productName, fields))}`;
}
