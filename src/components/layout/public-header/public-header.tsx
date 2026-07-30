import { publicLinks } from "./constants";
import { PublicHeaderDesktopActions, PublicHeaderMobileActions } from "./header-actions";
import { PublicHeaderLogo } from "./logo";
import { PublicHeaderMobileMenu } from "./mobile-menu";
import { PublicHeaderNav } from "./nav";

import type { ManagedImageAsset } from "@/types/home-assets";

type PublicHeaderProps = {
  logo?: ManagedImageAsset;
};

const iconButtonClass =
  "order-0 flex h-7 w-7 flex-none grow-0 items-center justify-center transition hover:opacity-70";

/**
 * Cabeçalho das páginas públicas da Papelito.
 * Compõe as variantes mobile e desktop a partir dos sub-componentes atômicos do módulo.
 * Quando logado: exibe ícones de carrinho e perfil.
 * Quando deslogado: exibe botões de "Entrar" e "Cadastrar".
 */
export function PublicHeader({ logo }: PublicHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-white/10 bg-brand-dark md:bg-brand-yellow">
      {/* Mobile */}
      <div className="mx-auto flex h-15 w-full max-w-391 items-center justify-between px-4 md:hidden">
        <PublicHeaderLogo logo={logo} variant="mobile" />

        <div className="flex items-center gap-2">
          <PublicHeaderMobileActions invertColors />

          <PublicHeaderMobileMenu
            iconButtonClass={`${iconButtonClass} text-white`}
            links={publicLinks.map(({ href, label }) => ({ href, label }))}
          />
        </div>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden w-full max-w-391 grid-cols-[1fr_auto_1fr] items-center gap-6 md:grid md:h-23.25 md:px-8">
        <PublicHeaderLogo logo={logo} variant="desktop" />

        <PublicHeaderNav links={publicLinks} />

        <div className="order-2 flex h-9 flex-none grow-0 items-center justify-self-end gap-4">
          <PublicHeaderDesktopActions />
        </div>
      </div>
    </header>
  );
}
