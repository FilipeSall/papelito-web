import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { fetchProfileCustomer } from "@/features/profile/server/customer";
import type { ProfileCustomer } from "@/features/profile/types/profile-customer";
import {
  buildProfileEmail,
  buildProfileName,
} from "@/features/profile/utils/profile-customer-mappers";
import { authOptions } from "@/lib/auth";

type AuthenticatedProfile = {
  accessToken?: string;
  customer: ProfileCustomer;
  image?: string | null;
  name: string;
  email: string;
};

/**
 * Garante um usuário autenticado e normaliza os dados mínimos usados na UI de perfil.
 */
export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/entrar");
  }

  const customer = await fetchProfileCustomer(session.accessToken);

  return {
    accessToken: session.accessToken,
    customer,
    name: buildProfileName(customer, session.user.name),
    email: buildProfileEmail(customer, session.user.email),
    image: session.user.image,
  };
}
