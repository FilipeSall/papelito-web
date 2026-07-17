import "server-only";

import { wpRest } from "@/lib/server/wp-rest";
import type {
  CreateVendorInterestInput,
  VendorInterest,
  VendorInterestMeResponse,
} from "../types/vendor-interest";

const VENDOR_INTERESTS_PATH = "/papelito/v1/vendor-interests";

export class VendorInterestRequestError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function fetchVendorInterest(
  accessToken?: string,
): Promise<VendorInterest | null> {
  if (!accessToken) return null;

  const result = await wpRest<VendorInterestMeResponse>(`${VENDOR_INTERESTS_PATH}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return result.ok && result.data.exists ? result.data.interest : null;
}

export async function createVendorInterest(
  accessToken: string,
  input: CreateVendorInterestInput,
): Promise<VendorInterest> {
  const result = await wpRest<{ interest: VendorInterest }>(VENDOR_INTERESTS_PATH, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    json: input,
  });

  if (!result.ok) {
    throw new VendorInterestRequestError(
      result.error.code,
      result.error.message || "Não foi possível registrar seu interesse.",
      result.status || result.error.data?.status || 422,
    );
  }

  return result.data.interest;
}

