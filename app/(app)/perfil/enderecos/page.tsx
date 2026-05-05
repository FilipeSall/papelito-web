import { ProfileAddressBook, ProfileContent, ProfileHero } from "@/components/layout/profile-page";

import { getAuthenticatedProfile } from "../_lib/get-authenticated-profile";

/**
 * Pagina de enderecos do usuario.
 *
 * Exibe a lista de enderecos cadastrados do usuario
 * com opcoes de adicionar, editar e remover enderecos.
 *
 * Rotas relacionadas:
 * - /perfil - Meus Pedidos
 * - /perfil/dados - Meus Dados
 * - /perfil/enderecos - Enderecos (atual)
 */
export default async function ProfileAddressesPage() {
  const profile = await getAuthenticatedProfile();

  return (
    <>
      <ProfileHero
        email={profile.email}
        image={profile.image}
        name={profile.name}
      />
      <ProfileContent>
        <ProfileAddressBook customer={profile.customer} />
      </ProfileContent>
    </>
  );
}
