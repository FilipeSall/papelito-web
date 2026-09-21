import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type {
  VendorEligibility,
  VendorEligibilityRequirement,
  VendorRequirementId,
} from "../types/vendor-eligibility";

type WpRequirement = {
  active_count?: unknown;
  advisory?: unknown;
  blocking?: unknown;
  id?: unknown;
  reason?: unknown;
  satisfied?: unknown;
};

type WpEligibility = {
  can_sell?: unknown;
  config?: { minimum_boxes?: unknown; recommended_boxes?: unknown };
  requirements?: unknown;
};

const REQUIREMENT_IDS: VendorRequirementId[] = ["account", "boxes", "pagarme"];

/**
 * Valor que o painel usa quando o WordPress não respondeu.
 *
 * O veredito fica explicitamente ilegível em vez de otimista ou pessimista: o painel não anuncia
 * bloqueio que talvez não exista, e a autorização real segue no WordPress a cada compra.
 */
function unreadableEligibility(): VendorEligibility {
  return {
    canSell: true,
    loadFailed: true,
    minimumBoxes: 0,
    recommendedBoxes: 0,
    requirements: [],
  };
}

function asPositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function mapRequirement(value: unknown): VendorEligibilityRequirement | null {
  if (!value || typeof value !== "object") return null;

  const item = value as WpRequirement;
  const id = REQUIREMENT_IDS.find((candidate) => candidate === item.id);

  if (!id) return null;

  const activeCount = typeof item.active_count === "number" ? item.active_count : undefined;

  return {
    ...(activeCount === undefined ? {} : { activeCount }),
    advisory: item.advisory === true,
    blocking: item.blocking === true,
    id,
    reason: typeof item.reason === "string" ? item.reason : "",
    satisfied: item.satisfied === true,
  };
}

/**
 * Carrega o veredito de elegibilidade do vendedor autenticado.
 *
 * Fica em cache curto com tag própria: as rotas que mexem em caixas e no recebedor invalidam a
 * tag, então o vendor que resolve uma pendência com o painel aberto vê o indicador sumir na
 * navegação seguinte sem nenhum polling.
 *
 * @returns Veredito normalizado, ou o estado ilegível quando o WordPress não respondeu.
 */
export async function getVendorEligibility(): Promise<VendorEligibility> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) {
    return unreadableEligibility();
  }

  const result = await wpRest<WpEligibility>("/papelito/v1/vendor/me/eligibility", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 60,
    tags: ["vendor-eligibility"],
  });

  if (!result.ok) {
    return unreadableEligibility();
  }

  const requirements = Array.isArray(result.data.requirements)
    ? result.data.requirements
        .map(mapRequirement)
        .filter((item): item is VendorEligibilityRequirement => item !== null)
    : [];
  const minimumBoxes = asPositiveInt(result.data.config?.minimum_boxes, 2);

  return {
    canSell: result.data.can_sell === true,
    loadFailed: false,
    minimumBoxes,
    recommendedBoxes: Math.max(minimumBoxes, asPositiveInt(result.data.config?.recommended_boxes, 3)),
    requirements,
  };
}
