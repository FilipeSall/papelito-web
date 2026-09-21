import type {
  VendorEligibility,
  VendorEligibilityRequirement,
  VendorRequirementId,
} from "../types/vendor-eligibility";

/** Rota do painel onde cada requisito é resolvido. */
export const VENDOR_REQUIREMENT_HREF: Record<VendorRequirementId, string> = {
  account: "/vendor/configuracoes#conta",
  boxes: "/vendor/cubagem",
  pagarme: "/vendor/configuracoes#pagamentos",
};

/** Item de navegação que carrega o marcador de cada requisito. */
export const VENDOR_REQUIREMENT_NAV_HREF: Record<VendorRequirementId, string> = {
  account: "/vendor/configuracoes",
  boxes: "/vendor/cubagem",
  pagarme: "/vendor/configuracoes",
};

/**
 * Pendência já traduzida para a linguagem do painel.
 *
 * `blocking` é o que impede a venda; `advisory` é recomendação, e nunca deve ser desenhada com a
 * mesma gravidade.
 */
export type VendorPendingItem = {
  detail: string;
  href: string;
  id: VendorRequirementId;
  kind: "advisory" | "blocking";
  navHref: string;
  title: string;
};

type Copy = { detail: string; title: string };

const PAGARME_COPY: Record<string, Copy> = {
  in_review: {
    detail: "A Pagar.me ainda está analisando o cadastro do recebedor da sua loja.",
    title: "Recebedor em análise na Pagar.me",
  },
  kyc_required: {
    detail: "A Pagar.me pediu a verificação do responsável legal para liberar os recebimentos.",
    title: "Verificação do responsável pendente",
  },
  last_sync_failed: {
    detail:
      "Seu recebedor continua ativo e você segue vendendo. A última consulta à Pagar.me falhou; atualize a situação quando puder.",
    title: "A última sincronização com a Pagar.me falhou",
  },
  never_synced: {
    detail: "Preencha os dados financeiros para a Papelito criar o recebedor da sua loja.",
    title: "Recebedor Pagar.me ainda não criado",
  },
  rejected: {
    detail: "O recebedor da sua loja está recusado, suspenso ou bloqueado na Pagar.me.",
    title: "Recebedor recusado pela Pagar.me",
  },
  sync_error: {
    detail: "A última tentativa de criar o recebedor voltou com erro. Revise os dados e sincronize de novo.",
    title: "Sincronização com a Pagar.me falhou",
  },
  unknown: {
    detail: "A Pagar.me devolveu um estado que este painel ainda não reconhece.",
    title: "Recebedor em estado desconhecido",
  },
};

const ACCOUNT_COPY: Record<string, Copy> = {
  suspended: {
    detail: "Enquanto a conta estiver suspensa a loja não vende. Fale com a Papelito para reativar.",
    title: "Conta suspensa",
  },
  unknown_vendor: {
    detail: "A Papelito não reconheceu esta loja. Fale com o suporte.",
    title: "Loja não identificada",
  },
};

function plural(count: number, singular: string, many: string) {
  return `${count} ${count === 1 ? singular : many}`;
}

function boxesCopy(
  requirement: VendorEligibilityRequirement,
  eligibility: VendorEligibility,
): Copy | null {
  const active = requirement.activeCount ?? 0;

  if (requirement.reason === "below_minimum") {
    const missing = Math.max(0, eligibility.minimumBoxes - active);
    return {
      detail: `Você tem ${active} de ${eligibility.minimumBoxes} ${
        eligibility.minimumBoxes === 1 ? "caixa ativa" : "caixas ativas"
      }. Cadastre mais ${plural(missing, "caixa", "caixas")} para os seus produtos voltarem à vitrine.`,
      title: "Caixas abaixo do mínimo",
    };
  }

  if (requirement.reason === "below_recommended") {
    return {
      detail: `Você tem ${plural(active, "caixa ativa", "caixas ativas")}, o mínimo exigido. Recomendamos cadastrar pelo menos ${
        eligibility.recommendedBoxes
      } para ter mais segurança e flexibilidade no cálculo e no envio dos pedidos.`,
      title: `Recomendamos ${eligibility.recommendedBoxes} caixas`,
    };
  }

  return null;
}

function requirementCopy(
  requirement: VendorEligibilityRequirement,
  eligibility: VendorEligibility,
): Copy | null {
  if (requirement.id === "boxes") return boxesCopy(requirement, eligibility);
  if (requirement.id === "pagarme") return PAGARME_COPY[requirement.reason] ?? null;
  return ACCOUNT_COPY[requirement.reason] ?? null;
}

/**
 * Traduz o veredito do WordPress na lista que o painel desenha.
 *
 * Bloqueios vêm antes das recomendações porque é a ordem em que o vendor precisa resolvê-las.
 * Requisito atendido e sem observação não produz item algum, e motivo que o painel não conhece é
 * descartado em vez de virar uma linha vazia.
 *
 * @param eligibility Veredito carregado do WordPress.
 * @returns Pendências ordenadas por gravidade.
 */
export function readVendorPendencies(eligibility: VendorEligibility): VendorPendingItem[] {
  if (eligibility.loadFailed) return [];

  const items = eligibility.requirements.flatMap((requirement) => {
    if (requirement.satisfied && !requirement.advisory) return [];

    const copy = requirementCopy(requirement, eligibility);
    if (!copy) return [];

    return [
      {
        ...copy,
        href: VENDOR_REQUIREMENT_HREF[requirement.id],
        id: requirement.id,
        kind: requirement.blocking ? ("blocking" as const) : ("advisory" as const),
        navHref: VENDOR_REQUIREMENT_NAV_HREF[requirement.id],
      },
    ];
  });

  return [
    ...items.filter((item) => item.kind === "blocking"),
    ...items.filter((item) => item.kind === "advisory"),
  ];
}

/**
 * Agrupa os bloqueios pelo item de navegação que os resolve.
 *
 * A navegação recebe no máximo um marcador por item, mesmo quando dois requisitos caem na mesma
 * página — é o que impede a barra de virar um mural de badges.
 *
 * @param pendencies Pendências já traduzidas.
 * @returns Mapa de href do item para os bloqueios que ele resolve.
 */
export function groupBlockingByNavHref(
  pendencies: VendorPendingItem[],
): Map<string, VendorPendingItem[]> {
  const grouped = new Map<string, VendorPendingItem[]>();

  for (const item of pendencies) {
    if (item.kind !== "blocking") continue;
    grouped.set(item.navHref, [...(grouped.get(item.navHref) ?? []), item]);
  }

  return grouped;
}
