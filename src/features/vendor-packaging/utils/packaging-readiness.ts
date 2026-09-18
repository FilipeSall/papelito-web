import type { VendorPackagingProfile } from "../types/vendor-packaging";

/**
 * Piso de caixas ativas que a Braspress exige do vendor.
 *
 * Vive como constante no front porque o contrato de embalagem não devolve o número, e hoje a
 * regra é informativa: nada é bloqueado abaixo dela. No dia em que o WordPress passar a barrar,
 * o número precisa viajar na resposta em vez de existir aqui em segunda cópia.
 */
export const BRASPRESS_MIN_ACTIVE_PROFILES = 3;

/**
 * Teto de caixas ativas por vendor, espelhando `PAPELITO_PACKAGING_MAX_ACTIVE_PROFILES`.
 *
 * O WordPress é quem recusa a criação acima do teto; este número existe só para a interface
 * avisar antes de a pessoa preencher o formulário. Inativas não contam.
 */
export const PACKAGING_MAX_ACTIVE_PROFILES = 24;

export type PackagingStepId = "modelos" | "medidas" | "despacho";

export type PackagingStepState = "done" | "current" | "pending";

/** Marco da faixa de setup, já resolvido contra os perfis do vendor. */
export type PackagingSetupStep = {
  detail: string;
  id: PackagingStepId;
  state: PackagingStepState;
  title: string;
};

/** Leitura única dos perfis, consumida pelos marcos e pela barra de prontidão. */
export type PackagingReadiness = {
  activeCount: number;
  inactiveCount: number;
  /** Caixas ativas ainda sem o peso da embalagem vazia. */
  missingTareCount: number;
  /** Caixas ativas preenchidas por modelo RPC que o vendor nunca abriu para conferir. */
  unconfirmedCount: number;
};

/**
 * Diz se a caixa ainda deve alguma conferência ao vendor.
 *
 * São duas dívidas diferentes com a mesma consequência: a medida nominal do catálogo, que o vendor
 * nunca comparou com a caixa no galpão, e a tara ausente, que o Guia Técnico dos Correios não
 * publica e por isso nasce vazia.
 */
function needsReview(item: VendorPackagingProfile): boolean {
  return (item.source === "rpc" && item.version === 1) || item.tareWeightG === 0;
}

/**
 * Resume os perfis do vendor nos três números de que a página inteira depende.
 *
 * `unconfirmedCount` conta as duas dívidas de conferência: `version === 1` numa caixa RPC prova que
 * ninguém revisou a medida, porque o contrato incrementa a versão em toda edição; tara zero prova
 * que o peso da embalagem vazia nunca foi informado, e nenhuma caixa real pesa zero.
 *
 * @param items Perfis como o WordPress os devolveu.
 * @returns Contagens de ativos, inativos e medidas por conferir.
 */
export function readPackagingReadiness(items: VendorPackagingProfile[]): PackagingReadiness {
  const active = items.filter((item) => item.active);

  return {
    activeCount: active.length,
    inactiveCount: items.length - active.length,
    missingTareCount: active.filter((item) => item.tareWeightG === 0).length,
    unconfirmedCount: active.filter(needsReview).length,
  };
}

function stepDetail(id: PackagingStepId, readiness: PackagingReadiness): string {
  if (id === "modelos") {
    if (readiness.activeCount === 0) return "Nenhuma caixa ativa ainda.";
    if (readiness.activeCount === 1) return "1 caixa ativa.";
    return `${readiness.activeCount} caixas ativas.`;
  }

  if (id === "medidas") {
    if (readiness.activeCount === 0) return "Sem caixa para conferir.";
    if (readiness.unconfirmedCount === 0) return "Medidas e taras conferidas.";
    if (readiness.unconfirmedCount === 1) return "1 caixa ainda pede conferência.";
    return `${readiness.unconfirmedCount} caixas ainda pedem conferência.`;
  }

  const faltam = BRASPRESS_MIN_ACTIVE_PROFILES - readiness.activeCount;
  if (faltam <= 0) return "A Braspress já tem caixa para cotar.";
  if (faltam === 1) return "Falta 1 caixa para a Braspress cotar.";
  return `Faltam ${faltam} caixas para a Braspress cotar.`;
}

const STEP_TITLES: Record<PackagingStepId, string> = {
  despacho: "Pronto para despachar",
  medidas: "Conferir medidas",
  modelos: "Escolher modelos",
};

const STEP_ORDER: PackagingStepId[] = ["modelos", "medidas", "despacho"];

function stepIsDone(id: PackagingStepId, readiness: PackagingReadiness): boolean {
  if (id === "modelos") return readiness.activeCount > 0;
  if (id === "medidas") return readiness.activeCount > 0 && readiness.unconfirmedCount === 0;
  return readiness.activeCount >= BRASPRESS_MIN_ACTIVE_PROFILES;
}

/**
 * Resolve os três marcos da faixa de setup.
 *
 * Só um marco é `current` por vez — o primeiro que ainda não fechou —, e os seguintes ficam
 * `pending`. Um marco concluído depois de um pendente continua `done`: a faixa relata o estado
 * real, não um progresso linear que mentiria sobre o que já está pronto.
 *
 * @param items Perfis do vendor.
 * @returns Os três marcos, na ordem em que a faixa os desenha.
 */
export function packagingSetupSteps(items: VendorPackagingProfile[]): PackagingSetupStep[] {
  const readiness = readPackagingReadiness(items);
  const firstOpen = STEP_ORDER.find((id) => !stepIsDone(id, readiness));

  return STEP_ORDER.map((id) => ({
    detail: stepDetail(id, readiness),
    id,
    state: resolveStepState(id, firstOpen, readiness),
    title: STEP_TITLES[id],
  }));
}

function resolveStepState(
  id: PackagingStepId,
  firstOpen: PackagingStepId | undefined,
  readiness: PackagingReadiness,
): PackagingStepState {
  if (stepIsDone(id, readiness)) return "done";
  return id === firstOpen ? "current" : "pending";
}
