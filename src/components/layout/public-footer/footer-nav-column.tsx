import Link from "next/link";

interface FooterNavLink {
  /**
   * Texto exibido no link.
   */
  label: string;
  /**
   * URL de destino do link.
   */
  href: string;
}

interface FooterNavColumnProps {
  /**
   * Titulo da coluna de navegacao.
   */
  title: string;
  /**
   * Lista de links da coluna.
   */
  links: FooterNavLink[];
}

/**
 * Coluna de navegacao do footer.
 *
 * Componente molecular que exibe um titulo e uma lista de links
 * para navegacao no footer.
 *
 * @example
 * ```tsx
 * <FooterNavColumn
 *   title="Produtos"
 *   links={[
 *     { label: "Sedas", href: "/produtos/sedas" },
 *     { label: "Piteiras", href: "/produtos/piteiras" },
 *   ]}
 * />
 * ```
 */
export function FooterNavColumn({ title, links }: FooterNavColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="font-black text-sm leading-5 tracking-[0.55px] uppercase text-white">
        {title}
      </h4>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm leading-5 tracking-[-0.15px] text-white/60 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
