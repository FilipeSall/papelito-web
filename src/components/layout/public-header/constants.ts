// TODO: Substituir por requisição ao backend — GET /api/navigation/header
// Links de navegação e ícones de ação devem ser configuráveis via CMS/backend.
export const publicLinks = [
  { href: "/", label: "Home", widthClass: "w-[38.99px]" },
  { href: "/produtos", label: "Produtos", widthClass: "w-[59.98px]" },
  { href: "/sobre", label: "Sobre", widthClass: "w-[39.05px]" },
];

export const actionIcons = [
  { href: "/carrinho", label: "Carrinho", src: "/images/icons/cart.svg", iconClass: "h-7 w-7" },
  { href: "/perfil", label: "Perfil", src: "/images/icons/profile.svg", iconClass: "h-7 w-7" },
];
