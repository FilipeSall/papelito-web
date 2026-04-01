import { PrivateHeaderNavLink } from "./nav-link";

type NavLink = {
  href: string;
  label: string;
  widthClass: string;
};

type PrivateHeaderNavProps = {
  links: NavLink[];
};

/**
 * Navegação principal do cabeçalho privado desktop.
 * Renderiza a lista de links usando `PrivateHeaderNavLink`.
 */
export function PrivateHeaderNav({ links }: PrivateHeaderNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
    >
      {links.map((item) => (
        <PrivateHeaderNavLink key={item.label} {...item} />
      ))}
    </nav>
  );
}
