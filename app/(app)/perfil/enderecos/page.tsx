import {
  Address,
  AddressList,
  ProfileContent,
  ProfileHero,
} from "@/components/layout/profile-page";

// TODO: Obter dados do usuario via API/context de autenticacao
const mockUser = {
  name: "Joao Silva",
  email: "joao.silva@email.com",
  badge: "MEMBRO PREMIUM",
  points: 1240,
};

// TODO: Obter enderecos do usuario via API
const mockAddresses: Address[] = [
  {
    id: "1",
    name: "Casa",
    street: "Rua das Flores, 123 - Apto 45",
    neighborhood: "Vila Mariana, Sao Paulo - SP",
    zipCode: "04101-000",
    isDefault: true,
  },
];

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
 * - /perfil/configuracoes - Configuracoes
 */
export default function ProfileAddressesPage() {
  return (
    <>
      <ProfileHero
        badge={mockUser.badge}
        email={mockUser.email}
        name={mockUser.name}
        points={mockUser.points}
      />
      <ProfileContent>
        <AddressList addresses={mockAddresses} />
      </ProfileContent>
    </>
  );
}
