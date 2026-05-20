import { FooterLogo } from "./footer-logo";
import { FooterNavColumn } from "./footer-nav-column";
import { FooterCopyright } from "./footer-copyright";

// TODO: Substituir por requisição ao backend — GET /api/navigation/footer
// Links de produto, empresa e suporte devem ser configuráveis via CMS/backend.
const productLinks = [
  { label: "Sedas", href: "/produtos?tipo=sedas" },
  { label: "Piteiras", href: "/produtos?tipo=piteiras" },
  { label: "Filtros", href: "/produtos?tipo=filtros" },
  { label: "Acessórios", href: "/produtos?tipo=acessorios" },
];

const companyLinks = [
  { label: "Site Oficial", href: "https://papelito.com.br" },
  { label: "Seja PDV Perfeito", href: "/revendedor" },
];

const supportLinks = [
  { label: "Minha Conta", href: "/perfil/dados" },
  { label: "Meus Pedidos", href: "/perfil" },
  { label: "Política de Privacidade", href: "/privacidade" },
  { label: "Termos de Uso", href: "/termos" },
  { label: "Fale Conosco", href: "mailto:contato@papelito.com.br" },
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
    <footer className="w-full bg-brand-dark px-6 pb-0 pt-16 lg:px-[174px]">
      <div className="mx-auto flex max-w-[1564px] flex-col gap-12">
        {/* Main Content */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:min-h-[220px] lg:grid-cols-4">
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
