import { RevendedorFormLink } from "@/components/layout/revendedor-page/revendedor-form-link";

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
            <RevendedorFormLink
              href={link.href}
              prefetch={false}
              className="text-sm leading-5 tracking-normal text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </RevendedorFormLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
