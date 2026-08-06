export type Application = { status: string; canUpload: boolean };
export type ApplicationLoadState = "loading" | "loaded" | "missing" | "error";

const KNOWN_STATUSES = [
  "document_required",
  "pending_manual_review",
  "approved",
  "rejected",
] as const;

/**
 * Estado único da tela, para a renderização virar um `switch`.
 *
 * `none` é "carregou sem candidatura": não renderiza conteúdo nenhum, ao contrário de
 * `unknown`, que é candidatura com status que a tela não conhece.
 */
export type ApplicationView =
  | ApplicationLoadState
  | "none"
  | "unknown"
  | (typeof KNOWN_STATUSES)[number];

function isKnownStatus(status: string): status is (typeof KNOWN_STATUSES)[number] {
  return (KNOWN_STATUSES as readonly string[]).includes(status);
}

export function resolveApplicationView(
  loadState: ApplicationLoadState,
  application: Application | null,
): ApplicationView {
  if (loadState !== "loaded") {
    return loadState;
  }

  if (!application) {
    return "none";
  }

  return isKnownStatus(application.status) ? application.status : "unknown";
}

export function applicationPageTitle(
  loadState: ApplicationLoadState,
  status: Application["status"] | undefined,
) {
  if (loadState === "missing") return "Nenhuma candidatura encontrada";
  if (loadState === "error") return "Não foi possível carregar a candidatura";
  if (loadState === "loading") return "Carregando candidatura";

  const titles: Record<string, string> = {
    approved: "Cadastro aprovado",
    document_required: "Envie seu documento com foto",
    pending_manual_review: "Sua candidatura está em análise",
    rejected: "Candidatura encerrada",
  };

  return titles[status ?? ""] ?? "Status da candidatura indisponível";
}
