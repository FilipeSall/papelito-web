import { PrivateHeaderCartIcon } from "./cart-icon";
import { privateLinks } from "./constants";
import { PrivateHeaderLogo } from "./logo";
import { PrivateHeaderLogoutButton } from "./logout-button";
import { PrivateHeaderMobileMenu } from "./mobile-menu";
import { PrivateHeaderNav } from "./nav";

const iconButtonClass =
  "flex h-7 w-7 shrink-0 items-center justify-center transition hover:opacity-70";

/**
 * Cabeçalho das páginas privadas da Papelito.
 * Compõe as variantes mobile e desktop a partir dos sub-componentes atômicos do módulo.
 * Utiliza fundo escuro (#231F20) e elementos claros para contraste.
 */
export function PrivateHeader() {
  // TODO: Obter quantidade do carrinho via context/store
  const cartItemCount = 2;

  return (
    <header className="w-full bg-brand-dark">
      {/* Mobile */}
      <div className="mx-auto flex w-full max-w-391 items-center justify-between px-4 py-3.75 md:hidden">
        <PrivateHeaderLogo />

        <div className="flex items-center gap-2">
          <PrivateHeaderCartIcon buttonClass={iconButtonClass} count={cartItemCount} />

          <PrivateHeaderMobileMenu
            iconButtonClass={`${iconButtonClass} text-white`}
            links={privateLinks.map(({ href, label }) => ({ href, label }))}
          />
        </div>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden w-full max-w-391 items-center justify-between px-8 py-4 md:flex">
        <PrivateHeaderLogo />

        <PrivateHeaderNav links={privateLinks} />

        <div className="flex h-9 items-center gap-4">
          <PrivateHeaderCartIcon buttonClass={iconButtonClass} count={cartItemCount} />
          <PrivateHeaderLogoutButton />
        </div>
      </div>
    </header>
  );
}
