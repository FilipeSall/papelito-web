import type { VendorPackagingProfile } from "../types/vendor-packaging";

/**
 * Escada de caixas ativas que o marketplace aplica ao vendor.
 *
 * Os dois números vêm do WordPress, em `/vendor/me/eligibility`, e são configuráveis pela
 * administração — nenhum deles pode voltar a existir como constante aqui. Abaixo do `minimum` a
 * loja sai da vitrine; entre `minimum` e `recommended` ela vende e recebe só a recomendação.
 */
export type PackagingBoxesPolicy = {
  minimum: number;
  recommended: number;
};

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
 * Diz se a caixa ainda deve conferência de medida ao vendor.
 *
 * Só conta a medida nominal do catálogo, que o vendor nunca comparou com a caixa no galpão. A tara
 * ausente é dívida real, mas já aparece na própria linha da caixa como "Tara não informada"; contá-la
 * aqui repetiria o mesmo aviso na faixa de setup.
 */
function needsReview(item: VendorPackagingProfile): boolean {
  return item.source === "rpc" && item.version === 1;
}

/**
 * Resume os perfis do vendor nos três números de que a página inteira depende.
 *
 * `unconfirmedCount` conta só a medida por conferir: `version === 1` numa caixa RPC prova que
 * ninguém revisou a medida, porque o contrato incrementa a versão em toda edição. `missingTareCount`
 * segue separado, para quem precisar da tara ausente sem misturá-la à conferência de medida.
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

function stepDetail(
  id: PackagingStepId,
  readiness: PackagingReadiness,
  policy: PackagingBoxesPolicy,
): string {
  if (id === "modelos") {
    if (readiness.activeCount === 0) return "Nenhuma caixa ativa ainda.";
    if (readiness.activeCount === 1) return "1 caixa ativa.";
    return `${readiness.activeCount} caixas ativas.`;
  }

  if (id === "medidas") {
    if (readiness.activeCount === 0) return "Sem caixa para conferir.";
    if (readiness.unconfirmedCount === 0) return "Medidas conferidas.";
    if (readiness.unconfirmedCount === 1) return "1 caixa ainda pede conferência.";
    return `${readiness.unconfirmedCount} caixas ainda pedem conferência.`;
  }

  const faltam = policy.minimum - readiness.activeCount;
  if (faltam === 1) return "Falta 1 caixa para seus produtos voltarem à vitrine.";
  if (faltam > 1) return `Faltam ${faltam} caixas para seus produtos voltarem à vitrine.`;
  if (readiness.activeCount < policy.recommended) {
    return `Mínimo atingido. Recomendamos ${policy.recommended} caixas para ter mais folga.`;
  }
  return "Caixas suficientes para as transportadoras cotarem.";
}

const STEP_TITLES: Record<PackagingStepId, string> = {
  despacho: "Pronto para despachar",
  medidas: "Conferir medidas",
  modelos: "Escolher modelos",
};

const STEP_ORDER: PackagingStepId[] = ["modelos", "medidas", "despacho"];

function stepIsDone(
  id: PackagingStepId,
  readiness: PackagingReadiness,
  policy: PackagingBoxesPolicy,
): boolean {
  if (id === "modelos") return readiness.activeCount > 0;
  if (id === "medidas") return readiness.activeCount > 0 && readiness.unconfirmedCount === 0;
  return readiness.activeCount >= policy.minimum;
}

/**
 * Resolve os três marcos da faixa de setup.
 *
 * Só um marco é `current` por vez — o primeiro que ainda não fechou —, e os seguintes ficam
 * `pending`. Um marco concluído depois de um pendente continua `done`: a faixa relata o estado
 * real, não um progresso linear que mentiria sobre o que já está pronto. O marco de despacho
 * fecha no mínimo configurado, e a recomendação aparece no detalhe sem reabrir o marco.
 *
 * @param items Perfis do vendor.
 * @param policy Mínimo e recomendado vigentes.
 * @returns Os três marcos, na ordem em que a faixa os desenha.
 */
export function packagingSetupSteps(
  items: VendorPackagingProfile[],
  policy: PackagingBoxesPolicy,
): PackagingSetupStep[] {
  const readiness = readPackagingReadiness(items);
  const firstOpen = STEP_ORDER.find((id) => !stepIsDone(id, readiness, policy));

  return STEP_ORDER.map((id) => ({
    detail: stepDetail(id, readiness, policy),
    id,
    state: resolveStepState(id, firstOpen, readiness, policy),
    title: STEP_TITLES[id],
  }));
}

function resolveStepState(
  id: PackagingStepId,
  firstOpen: PackagingStepId | undefined,
  readiness: PackagingReadiness,
  policy: PackagingBoxesPolicy,
): PackagingStepState {
  if (stepIsDone(id, readiness, policy)) return "done";
  return id === firstOpen ? "current" : "pending";
}
