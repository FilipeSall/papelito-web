import { FooterLogo } from "./footer-logo";
import { FooterNavColumn } from "./footer-nav-column";
import { FooterCopyright } from "./footer-copyright";

// TODO: Substituir por requisição ao backend — GET /api/navigation/footer
// Links de produto, empresa e suporte devem ser configuráveis via CMS/backend.
const productLinks = [
  { label: "Sedas", href: "/produtos/sedas" },
  { label: "Piteiras", href: "/produtos/piteiras" },
  { label: "Filtros", href: "/produtos/filtros" },
  { label: "Kits", href: "/produtos/kits" },
  { label: "Acessorios", href: "/produtos/acessorios" },
  { label: "Novidades", href: "/novidades" },
];

const companyLinks = [
  { label: "Seja um Revendedor", href: "/revendedor" },
  { label: "Sustentabilidade", href: "/sustentabilidade" },
  { label: "Trabalhe Conosco", href: "/carreiras" },
];

const supportLinks = [
  { label: "Minha Conta", href: "/conta" },
  { label: "Meus Pedidos", href: "/pedidos" },
  { label: "Trocas e Devolucoes", href: "/trocas" },
  { label: "Politica de Privacidade", href: "/privacidade" },
  { label: "Termos de Uso", href: "/termos" },
  { label: "Fale Conosco", href: "/contato" },
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
export function PublicFooter() {
  return (
    <footer className="w-full bg-brand-dark pt-16 px-6 pb-6 lg:px-43.5">
      <div className="mx-auto flex max-w-391 flex-col gap-12">
        {/* Main Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <FooterLogo />
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
