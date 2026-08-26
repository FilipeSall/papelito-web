import { FooterLogo } from "./footer-logo";
import { FooterNavColumn } from "./footer-nav-column";
import { FooterCopyright } from "./footer-copyright";

import { getPapelitoTaxonomy } from "@/features/catalog/services/get-papelito-categories";
import { PAPELITO_COMPANY } from "@/lib/seo/company";
import type { ManagedImageAsset } from "@/types/home-assets";

type PublicFooterProps = {
  logo?: ManagedImageAsset;
};

const companyLinks = [
  { label: "Site Oficial", href: PAPELITO_COMPANY.officialSiteUrl },
  { label: "Seja PDV Perfeito", href: "/revendedor" },
];

const supportLinks = [
  { label: "Minha Conta", href: "/perfil/dados" },
  { label: "Meus Pedidos", href: "/perfil" },
  { label: "Política de Privacidade", href: "/privacidade" },
  { label: "Fale Conosco", href: PAPELITO_COMPANY.contactPageUrl },
];

/**
 * Footer principal do site publico.
 *
 * Componente de layout que exibe o footer completo com:
 * - Logo e descricao da empresa
 * - Links de redes sociais
 * - Colunas de navegacao (Produtos, Empresa, Atendimento)
 * - Barra de copyright
 *
 * Cores utilizadas:
 * - Fundo: `brand-dark` (#231F20)
 * - Texto: branco com opacidades variadas
 *
 * @example
 * ```tsx
 * // Uso no layout publico
 * <PublicFooter />
 * ```
 */
export async function PublicFooter({ logo }: PublicFooterProps) {
  const taxonomy = await getPapelitoTaxonomy();
  const productLinks = taxonomy.categories.map((category) => ({
    label: category.name,
    href: `/produtos?tipo=${encodeURIComponent(category.slug)}`,
  }));

  return (
    <footer className="w-full bg-brand-dark px-6 pb-0 pt-16 lg:px-43.5">
      <div className="mx-auto flex max-w-391 flex-col gap-12">
        {/* Main Content */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:min-h-55 lg:grid-cols-4">
          <FooterLogo logo={logo} />
          <FooterNavColumn title="Produtos" links={productLinks} />
          <FooterNavColumn title="Empresa" links={companyLinks} />
          <FooterNavColumn title="Atendimento" links={supportLinks} />
        </div>

        {/* Copyright */}
        <FooterCopyright />
      </div>
    </footer>
  );
}
