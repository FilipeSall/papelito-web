import "server-only";

import { wpRest } from "@/lib/server/wp-rest";
import type {
  RevendedorApplication,
  SubmitRevendedorApplicationInput,
  VendorApplicationResponse,
} from "@/features/revendedor/types/revendedor-application";
import {
  createEmptyRevendedorApplication,
  normalizeRevendedorApplication,
} from "@/features/revendedor/utils/revendedor-registration";

const VENDOR_APPLICATION_PATH = "/papelito/v1/vendor/application";

class RevendedorApplicationRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchRevendedorApplication(
  accessToken?: string,
): Promise<RevendedorApplication> {
  if (!accessToken) {
    return createEmptyRevendedorApplication();
  }

  const result = await wpRest<VendorApplicationResponse>(VENDOR_APPLICATION_PATH, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return result.ok ? normalizeRevendedorApplication(result.data) : createEmptyRevendedorApplication();
}

export async function submitRevendedorApplication(
  accessToken: string,
  input: SubmitRevendedorApplicationInput,
): Promise<{ message: string; application: RevendedorApplication }> {
  const result = await wpRest<{
    message?: string;
    status?: string;
    submittedAt?: string;
    application?: VendorApplicationResponse["application"];
    pagarmeDraft?: VendorApplicationResponse["pagarmeDraft"];
  }>(VENDOR_APPLICATION_PATH, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: input,
  });

  if (!result.ok) {
    throw new RevendedorApplicationRequestError(
      result.error.message || "Não foi possível enviar a candidatura.",
      result.status || result.error.data?.status || 422,
    );
  }

  return {
    message:
      result.data.message ??
      "Triagem enviada com sucesso. Nosso time vai analisar seus dados.",
    application: normalizeRevendedorApplication({
      status:
        result.data.status === "pending" ||
        result.data.status === "incomplete" ||
        result.data.status === "approved" ||
        result.data.status === "rejected"
          ? result.data.status
          : "none",
      submittedAt: result.data.submittedAt ?? "",
      application:
        result.data.application ?? {
          step1: createEmptyRevendedorApplication().step1,
          step2: createEmptyRevendedorApplication().step2,
        },
      pagarmeDraft: result.data.pagarmeDraft ?? null,
    }),
  };
}
