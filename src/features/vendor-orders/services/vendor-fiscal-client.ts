import { DirectUploadError, uploadDirectFile } from "@/lib/client/direct-upload";

import { mapVendorOrderFiscal, type WpVendorFiscal } from "./vendor-order-mappers";
import type { VendorFiscalRole, VendorOrderFiscal } from "../types/vendor-orders";

export type VendorFiscalDeclared = {
  accessKey?: string;
  docNumber?: string;
  docSeries?: string;
  docType?: string;
  issuedAt?: string;
  issuerCnpj?: string;
  issuerName?: string;
  notes?: string;
  protocol?: string;
  totalCents?: number;
};

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

export async function saveVendorFiscalDeclared(
  orderId: number,
  declared: VendorFiscalDeclared,
): Promise<VendorOrderFiscal> {
  return readFiscal(
    await fetch(`/api/vendor/orders/${orderId}/fiscal-document`, {
      body: JSON.stringify(declared),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );
}

/**
 * Envia o arquivo da nota direto ao WordPress, pelo mesmo fluxo de tíquete dos
 * outros uploads: o arquivo nunca passa pela Function da Vercel, que tem limite
 * de corpo menor que o DANFE de 10 MB.
 */
export async function uploadVendorFiscalFile({
  declared,
  file,
  mode,
  orderId,
  role,
}: {
  declared: VendorFiscalDeclared;
  file: File;
  mode: "attach" | "replace";
  orderId: number;
  role: VendorFiscalRole;
}): Promise<VendorOrderFiscal> {
  try {
    const payload = await uploadDirectFile<WpVendorFiscal>("vendor-fiscal-document", file, {
      declared,
      mode,
      orderId,
      role,
    });

    return mapVendorOrderFiscal(payload);
  } catch (error) {
    if (error instanceof DirectUploadError) {
      throw new VendorFiscalError(error.message, error.status);
    }

    throw error;
  }
}
