// TODO: Substituir por requisição ao backend — GET /api/navigation/header
// Links de navegação e ícones de ação devem ser configuráveis via CMS/backend.
export const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/produtos", label: "Produtos" },
  { href: "/sobre", label: "Sobre" },
];

export const actionIcons = [
  { href: "/carrinho", label: "Carrinho", src: "/images/icons/cart.svg", iconClass: "h-7 w-7" },
  { href: "/perfil", label: "Perfil", src: "/images/icons/profile.svg", iconClass: "h-7 w-7" },
];
