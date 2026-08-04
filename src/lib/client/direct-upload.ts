export const DIRECT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export type DirectUploadPurpose =
  | "catalog"
  | "media"
  | "owner-document"
  | "pre-account-document";

type UploadTicket = {
  code?: string;
  expiresAt?: string;
  message?: string;
  ticket?: string;
  uploadUrl?: string;
};

type UploadResponse<T> = T & { code?: string; message?: string };

/**
 * Erro de upload que preserva o status HTTP.
 *
 * O chamador precisa distinguir "candidatura não aceita documento" (409) de falha de rede (0) para
 * decidir se oferece nova tentativa; um `Error` cru colapsava tudo no mesmo caso.
 */
export class DirectUploadError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "DirectUploadError";
    this.status = status;
    this.code = code;
  }
}

function uploadError(
  response: Response,
  body: { code?: string; message?: string } | null,
  fallback: string,
) {
  const message =
    response.status === 413 ? "O arquivo excede o limite de 10 MB." : body?.message ?? fallback;

  return new DirectUploadError(message, response.status, body?.code ?? null);
}

async function readJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

export async function uploadDirectFile<T>(purpose: DirectUploadPurpose, file: File): Promise<T> {
  if (file.size <= 0) {
    throw new DirectUploadError("O arquivo selecionado está vazio.", 422);
  }
  if (file.size > DIRECT_UPLOAD_MAX_BYTES) {
    throw new DirectUploadError("O arquivo excede o limite de 10 MB.", 413);
  }

  const ticketResponse = await fetch("/api/uploads/ticket", {
    body: JSON.stringify({ purpose }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const ticket = await readJson<UploadTicket>(ticketResponse);

  if (!ticketResponse.ok || !ticket?.ticket || !ticket.uploadUrl) {
    throw uploadError(ticketResponse, ticket, "Não foi possível autorizar o upload.");
  }

  const formData = new FormData();
  formData.set("file", file, file.name);

  const uploadResponse = await fetch(ticket.uploadUrl, {
    body: formData,
    headers: { "X-Papelito-Upload-Ticket": ticket.ticket },
    method: "POST",
  });
  const payload = await readJson<UploadResponse<T>>(uploadResponse);

  if (!uploadResponse.ok || !payload) {
    throw uploadError(uploadResponse, payload, "Não foi possível enviar o arquivo.");
  }

  return payload;
}
