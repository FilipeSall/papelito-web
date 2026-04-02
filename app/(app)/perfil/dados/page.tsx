import {
  ProfileContent,
  ProfileDataForm,
  ProfileHero,
} from "@/components/layout/profile-page";

// TODO: Obter dados do usuario via API/context de autenticacao
const mockUser = {
  name: "Joao Silva",
  email: "joao.silva@email.com",
  badge: "MEMBRO PREMIUM",
  points: 1240,
};

// TODO: Obter dados cadastrais do usuario via API
const mockUserData = {
  name: "Joao Silva",
  email: "joao.silva@email.com",
  phone: "(11) 99999-9999",
  cpf: "000.000.000-00",
  birthDate: "",
};

/**
 * Pagina de dados pessoais do usuario.
 *
 * Exibe o formulario com os dados cadastrais do usuario
 * permitindo visualizacao e edicao dos mesmos.
 *
 * Rotas relacionadas:
 * - /perfil - Meus Pedidos
 * - /perfil/dados - Meus Dados (atual)
 * - /perfil/enderecos - Enderecos
 * - /perfil/pagamentos - Pagamentos
 * - /perfil/configuracoes - Configuracoes
 */
export default function ProfileDataPage() {
  return (
    <>
      <ProfileHero
        badge={mockUser.badge}
        email={mockUser.email}
        name={mockUser.name}
        points={mockUser.points}
      />
      <ProfileContent>
        <ProfileDataForm userData={mockUserData} />
      </ProfileContent>
    </>
  );
}
