import { PublicHeaderNavLink } from "./nav-link";

type NavLink = {
  href: string;
  label: string;
};

type PublicHeaderNavProps = {
  links: NavLink[];
};

/**
 * Navegação principal do cabeçalho desktop.
 * Renderiza a lista de links públicos usando `PublicHeaderNavLink`.
 */
export function PublicHeaderNav({ links }: PublicHeaderNavProps) {
  return (
    <nav aria-label="Navegação pública" className="flex flex-wrap items-center justify-center gap-x-9 gap-y-2">
      {links.map((item) => (
        <PublicHeaderNavLink key={item.label} {...item} />
      ))}
    </nav>
  );
}
