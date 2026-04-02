import {
  PaymentList,
  PaymentMethod,
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

// TODO: Obter cartoes do usuario via API
const mockPayments: PaymentMethod[] = [
  {
    id: "1",
    brand: "VISA",
    lastFourDigits: "4242",
    holderName: "Joao Silva",
    expiryDate: "12/28",
    isDefault: true,
  },
];

/**
 * Pagina de formas de pagamento do usuario.
 *
 * Exibe a lista de cartoes cadastrados do usuario
 * com opcoes de adicionar novos cartoes.
 *
 * Rotas relacionadas:
 * - /perfil - Meus Pedidos
 * - /perfil/dados - Meus Dados
 * - /perfil/enderecos - Enderecos
 * - /perfil/pagamentos - Pagamentos (atual)
 * - /perfil/configuracoes - Configuracoes
 */
export default function ProfilePaymentsPage() {
  return (
    <>
      <ProfileHero
        badge={mockUser.badge}
        email={mockUser.email}
        name={mockUser.name}
        points={mockUser.points}
      />
      <ProfileContent>
        <PaymentList payments={mockPayments} />
      </ProfileContent>
    </>
  );
}
