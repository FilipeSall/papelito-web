import type { CouponListFilters } from "@/features/coupons/types/coupon";

export const COMMERCIAL_PATH = "/admin/comercial";

/**
 * As três mecânicas comerciais vêm primeiro e no mesmo peso; parcelamento fica depois de um
 * separador, porque é configuração de pagamento do checkout e não uma quarta mecânica.
 */
export const COMMERCIAL_TABS = ["cupons", "frete", "colecoes", "parcelamento"] as const;

export type CommercialTab = (typeof COMMERCIAL_TABS)[number];

export const COMMERCIAL_TAB_LABELS: Record<CommercialTab, string> = {
  cupons: "Cupons",
  frete: "Frete grátis",
  colecoes: "Coleções",
  parcelamento: "Parcelamento",
};

export const COUPONS_PER_PAGE = 20;

export type CouponStatusFilter = "any" | "publish" | "draft";

export const COUPON_STATUS_FILTERS = ["any", "publish", "draft"] as const;

export const COUPON_STATUS_FILTER_LABELS: Record<CouponStatusFilter, string> = {
  any: "Ativos e rascunhos",
  publish: "Só ativos",
  draft: "Só rascunhos",
};

export type CommercialSearchParams = Record<string, string | string[] | undefined>;

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }

  return typeof value === "string" ? value : "";
}

export function parseCommercialTab(value: string | string[] | undefined): CommercialTab {
  const raw = firstString(value);

  return (COMMERCIAL_TABS as readonly string[]).includes(raw) ? (raw as CommercialTab) : "cupons";
}

export function parseCouponStatusFilter(value: string | string[] | undefined): CouponStatusFilter {
  const raw = firstString(value);

  return (COUPON_STATUS_FILTERS as readonly string[]).includes(raw)
    ? (raw as CouponStatusFilter)
    : "any";
}

export type CouponsPageFilters = {
  page: number;
  search: string;
  status: CouponStatusFilter;
};

export function parseCouponsPageFilters(
  searchParams: CommercialSearchParams = {},
): CouponsPageFilters {
  const rawPage = Number.parseInt(firstString(searchParams.page), 10);

  return {
    page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    search: firstString(searchParams.search).trim(),
    status: parseCouponStatusFilter(searchParams.status),
  };
}

export function toCouponListFilters(filters: CouponsPageFilters): CouponListFilters {
  return {
    page: filters.page,
    perPage: COUPONS_PER_PAGE,
    search: filters.search || undefined,
    status: filters.status,
  };
}

/**
 * Monta a URL da seção. Valor padrão é omitido — a tela é compartilhável e o link não deve
 * carregar estado que ninguém escolheu.
 */
export function commercialHref(tab: CommercialTab, filters?: Partial<CouponsPageFilters>): string {
  const params = new URLSearchParams();

  if (tab !== "cupons") {
    params.set("tab", tab);
  }

  if (tab === "cupons" && filters) {
    if (filters.status && filters.status !== "any") {
      params.set("status", filters.status);
    }

    if (filters.search) {
      params.set("search", filters.search);
    }

    if (filters.page && filters.page > 1) {
      params.set("page", String(filters.page));
    }
  }

  const search = params.toString();

  return search ? `${COMMERCIAL_PATH}?${search}` : COMMERCIAL_PATH;
}
