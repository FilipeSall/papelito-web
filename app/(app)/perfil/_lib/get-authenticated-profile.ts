import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { fetchCompanyContext } from "@/lib/server/company-api";
import { fetchProfileCustomer } from "@/features/profile/server/customer";
import type { CompanyDetails } from "@/features/company/types/company";
import type { ProfileCustomer } from "@/features/profile/types/profile-customer";
import {
  buildProfileEmail,
  buildProfileName,
} from "@/features/profile/utils/profile-customer-mappers";
import { authOptions } from "@/lib/auth";

type AuthenticatedProfile = {
  customer: ProfileCustomer;
  company: CompanyDetails | null;
  image?: string | null;
  name: string;
  email: string;
};

/**
 * Garante um usuário autenticado e normaliza os dados mínimos usados na UI de perfil.
 */
export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    redirect("/entrar");
  }

  const [customer, companyContext] = await Promise.all([
    fetchProfileCustomer(session.accessToken),
    fetchCompanyContext(session.accessToken),
  ]);

  return {
    customer,
    company: companyContext.ok ? companyContext.data.company ?? null : null,
    name: buildProfileName(customer, session.user.name),
    email: buildProfileEmail(customer, session.user.email),
    image: session.user.image,
  };
}
