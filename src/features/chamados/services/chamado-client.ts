import type { RichTextDocument } from "@/features/rich-text";

import {
  mapChamado,
  mapChamadoReasonCatalog,
  type WpChamado,
  type WpChamadoReasonCatalog,
} from "./chamado-mappers";
import type { Chamado, ChamadoReasonCatalog } from "../types/chamado";

type ErrorPayload = {
  code?: string;
  message?: string;
  data?: { thread_id?: unknown };
  thread_id?: unknown;
};

/**
 * O backend recusa um segundo chamado aberto com o mesmo motivo e diz qual já existe. Carregar o
 * id no erro deixa a interface levar a pessoa até lá em vez de só repetir a recusa.
 */
export class ChamadoAlreadyOpenError extends Error {
  constructor(
    message: string,
    readonly threadId: number,
  ) {
    super(message);
    this.name = "ChamadoAlreadyOpenError";
  }
}

async function readThreadResponse(response: Response): Promise<Chamado> {
  const body = (await response.json().catch(() => null)) as WpChamado | ErrorPayload | null;

  if (!response.ok) {
    const error = (body ?? {}) as ErrorPayload;
    const message =
      typeof error.message === "string" ? error.message : "Não foi possível atualizar a conversa.";

    if (error.code === "papelito_message_chamado_open_exists") {
      const threadId = Number(error.data?.thread_id ?? error.thread_id) || 0;
      throw new ChamadoAlreadyOpenError(message, threadId);
    }

    throw new Error(message);
  }

  return mapChamado((body ?? {}) as WpChamado);
}

export async function fetchChamado(threadId: number): Promise<Chamado> {
  return readThreadResponse(await fetch(`/api/messages/threads/${threadId}`, { cache: "no-store" }));
}

export type ChamadoDraft = {
  content?: RichTextDocument;
  orderId: number;
  plainText: string;
  reason: string;
  reasonOther?: string;
  returnReason?: string;
};

export async function createChamado(draft: ChamadoDraft): Promise<Chamado> {
  return readThreadResponse(
    await fetch("/api/messages/threads", {
      body: JSON.stringify({
        body: draft.plainText,
        content: draft.content,
        order_id: draft.orderId,
        reason: draft.reason,
        reason_other: draft.reasonOther,
        return_reason: draft.returnReason,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );
}

export async function createPagarmeBankAccountSupportThread(): Promise<Chamado> {
  return readThreadResponse(
    await fetch("/api/messages/support/pagarme-bank-account", {
      method: "POST",
    }),
  );
}

export async function sendChamadoMessage(
  threadId: number,
  message: { content?: RichTextDocument; plainText: string },
): Promise<Chamado> {
  return readThreadResponse(
    await fetch(`/api/messages/threads/${threadId}`, {
      body: JSON.stringify({ body: message.plainText, content: message.content }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );
}

/** Encerra o chamado. A recusa de verdade é do WordPress: aqui só repassamos a mensagem dele. */
export async function closeChamado(threadId: number): Promise<Chamado> {
  return readThreadResponse(
    await fetch(`/api/messages/threads/${threadId}/close`, { method: "POST" }),
  );
}

export async function fetchChamadoReasons(): Promise<ChamadoReasonCatalog> {
  const response = await fetch("/api/messages/chamado-reasons", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Não foi possível carregar os motivos.");
  }

  return mapChamadoReasonCatalog(
    ((await response.json().catch(() => null)) ?? {}) as WpChamadoReasonCatalog,
  );
}

export async function markChamadoRead(threadId: number): Promise<Chamado> {
  return readThreadResponse(
    await fetch(`/api/messages/threads/${threadId}/read`, {
      method: "PUT",
    }),
  );
}

export async function escalateChamado(threadId: number): Promise<Chamado> {
  return readThreadResponse(
    await fetch(`/api/messages/threads/${threadId}/escalate`, {
      method: "POST",
    }),
  );
}
