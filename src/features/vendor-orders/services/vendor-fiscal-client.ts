import { DirectUploadError, uploadDirectFile } from "@/lib/client/direct-upload";

import { mapVendorOrderFiscal, type WpVendorFiscal } from "./vendor-order-mappers";
import type { VendorOrderFiscal } from "../types/vendor-orders";

/**
 * Erro de nota fiscal que preserva o status HTTP.
 *
 * O chamador precisa distinguir "pedido não aceita nota" (409) de recusa do
 * arquivo (415/422) para escolher entre esconder o formulário e pedir outro
 * arquivo; um `Error` cru colapsaria os dois casos.
 */
export class VendorFiscalError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "VendorFiscalError";
    this.status = status;
  }
}

async function readFiscal(response: Response): Promise<VendorOrderFiscal> {
  const body = (await response.json().catch(() => null)) as
    | (WpVendorFiscal & { message?: string })
    | null;

  if (!response.ok) {
    throw new VendorFiscalError(
      body?.message ?? "Não foi possível registrar a nota fiscal.",
      response.status,
    );
  }

  return mapVendorOrderFiscal(body ?? undefined);
}

export async function fetchVendorFiscalDocument(orderId: number): Promise<VendorOrderFiscal> {
  return readFiscal(
    await fetch(`/api/vendor/orders/${orderId}/fiscal-document`, {
      headers: { Accept: "application/json" },
      method: "GET",
    }),
  );
}

/**
 * Remove a nota do pedido: some a linha e some o arquivo.
 *
 * O que fica é o registro na trilha — é o único rastro de que existiu uma nota
 * ali, e é por isso que a trilha continua vindo no bloco depois da remoção.
 */
export async function deleteVendorFiscalDocument(orderId: number): Promise<VendorOrderFiscal> {
  return readFiscal(
    await fetch(`/api/vendor/orders/${orderId}/fiscal-document`, {
      headers: { Accept: "application/json" },
      method: "DELETE",
    }),
  );
}

/**
 * Envia o arquivo da nota direto ao WordPress, pelo mesmo fluxo de tíquete dos
 * outros uploads: o arquivo nunca passa pela Function da Vercel, que tem limite
 * de corpo menor que o PDF de 10 MB.
 *
 * Sempre substitui a nota que houver — o pedido guarda uma só.
 */
export async function uploadVendorFiscalFile({
  file,
  orderId,
}: {
  file: File;
  orderId: number;
}): Promise<VendorOrderFiscal> {
  try {
    return mapVendorOrderFiscal(
      await uploadDirectFile<WpVendorFiscal>("vendor-fiscal-document", file, { orderId }),
    );
  } catch (error) {
    if (error instanceof DirectUploadError) {
      throw new VendorFiscalError(error.message, error.status);
    }

    throw error;
  }
}
