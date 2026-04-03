// TODO: Substituir por requisição ao backend — GET /api/navigation/private-header
// Links de navegação e ícones de ação devem ser configuráveis via CMS/backend.
export const privateLinks = [
  { href: "/", label: "Home", widthClass: "w-[38.99px]" },
  { href: "/produtos", label: "Produtos", widthClass: "w-[59.98px]" },
  { href: "/sobre", label: "Sobre", widthClass: "w-[39.05px]" },
];

export const actionIcons: { href: string; label: string; src: string; iconClass: string }[] = [];
