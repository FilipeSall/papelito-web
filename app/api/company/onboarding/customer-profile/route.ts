import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";

import { authOptions } from "@/lib/auth";
import {
  getAccountActiveVendorTag,
  getAccountCoverageCepTag,
} from "@/lib/server/account-cache-tags";
import { proxyCompanyRequest } from "@/lib/server/company-proxy";

export async function POST(request: Request) {
  const response = await proxyCompanyRequest(request, "/papelito/v1/onboarding/customer-profile");

  // O CEP da conta fica em unstable_cache por 5 min (get-account-coverage-cep). Sem invalidar
  // aqui, o aviso "conta sem CEP" continua na tela mesmo depois de o onboarding salvar o endereço.
  if (response.ok) {
    const session = await getServerSession(authOptions);
    const accountId = session?.user?.id ?? session?.user?.email ?? "anonymous";

    revalidateTag(getAccountCoverageCepTag(accountId), "max");
    revalidateTag(getAccountActiveVendorTag(accountId), "max");
    revalidateTag("wp:coverage", "max");
  }

  return response;
}
