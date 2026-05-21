import "server-only";

import { getServerSession } from "next-auth";

import { fetchProfileCustomer } from "@/features/profile/server/customer";
import { authOptions } from "@/lib/auth";
import { normalizeUserCep } from "../constants/user-cep";

export interface AccountCoverageCepContext {
  isAuthenticated: boolean;
  cep: string | null;
}

export async function getAccountCoverageCepContext(): Promise<AccountCoverageCepContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return {
      isAuthenticated: false,
      cep: null,
    };
  }

  const customer = await fetchProfileCustomer(session.accessToken);
  const cep =
    normalizeUserCep(customer.shipping.postcode) ??
    normalizeUserCep(customer.billing.postcode) ??
    normalizeUserCep(customer.meta.cep);

  return {
    isAuthenticated: true,
    cep,
  };
}
