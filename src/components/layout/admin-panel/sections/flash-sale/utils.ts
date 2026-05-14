import type {
  AdminFlashSaleCampaign,
  AdminFlashSaleProduct,
} from "@/lib/server/admin-flash-sale";

export type FlashSaleDraft = {
  discountPercent: number;
  endsAt: string;
  startsAt: string;
  title: string;
};

export type FlashSaleStatusTone = "default" | "warning";

export type FlashSaleStatus = {
  description: string;
  label: string;
  tone: FlashSaleStatusTone;
};

export function campaignToDraft(campaign: AdminFlashSaleCampaign | null): FlashSaleDraft {
  return {
    discountPercent: campaign?.discountPercent ?? 0,
    endsAt: toDatetimeLocal(campaign?.endsAt),
    startsAt: toDatetimeLocal(campaign?.startsAt),
    title: campaign?.title ?? "",
  };
}

export function deriveStatus(startsAt: string, endsAt: string): FlashSaleStatus {
  if (!startsAt || !endsAt) {
    return {
      description: "Defina nome, período e produtos para ativar a campanha.",
      label: "Aguardando configuração",
      tone: "warning",
    };
  }

  const startsAtMs = Date.parse(startsAt);
  const endsAtMs = Date.parse(endsAt);

  if (Number.isNaN(startsAtMs) || Number.isNaN(endsAtMs) || startsAtMs >= endsAtMs) {
    return {
      description: "Janela inválida: o início precisa ser anterior ao fim.",
      label: "Janela inválida",
      tone: "warning",
    };
  }

  const now = Date.now();

  if (now < startsAtMs) {
    return {
      description: "Campanha programada. Aguardando início.",
      label: "Agendada",
      tone: "default",
    };
  }

  if (now > endsAtMs) {
    return {
      description: "Janela encerrada. Edite ou remova a campanha.",
      label: "Encerrada",
      tone: "warning",
    };
  }

  return {
    description: "Campanha ativa e visível na home.",
    label: "Ativa",
    tone: "default",
  };
}

export function buildProductWarnings(products: AdminFlashSaleProduct[]): string[] {
  return products
    .filter((product) => !product.hasImage)
    .map((product) => `${product.name} está sem imagem principal.`);
}

export function clampDiscountInput(value: string): number {
  if (value === "") {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(99, Math.max(0, parsed));
}

export function toDatetimeLocal(value: string | undefined) {
  if (!value) {
    return "";
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return "";
  }

  const date = new Date(parsed);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function toApiDatetime(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

export function toMoney(value: string) {
  const parsed = Number.parseFloat(value || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

export function applyDiscount(base: number, discountPercent: number) {
  const clampedPercent = Math.min(99, Math.max(0, discountPercent));
  return Math.round(base * (100 - clampedPercent)) / 100;
}
