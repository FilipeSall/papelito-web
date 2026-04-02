import { PublicHeaderActionIcon } from "./action-icon";
import { PublicHeaderAuthButtons } from "./auth-buttons";
import { actionIcons, publicLinks } from "./constants";
import { PublicHeaderLogo } from "./logo";
import { PublicHeaderMobileMenu } from "./mobile-menu";
import { PublicHeaderNav } from "./nav";

const iconButtonClass =
  "order-0 flex h-7 w-7 flex-none grow-0 items-center justify-center transition hover:opacity-70";

/**
 * Cabeçalho das páginas públicas da Papelito.
 * Compõe as variantes mobile e desktop a partir dos sub-componentes atômicos do módulo.
 */
export function PublicHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-white/10 bg-brand-dark md:bg-brand-yellow">
      {/* Mobile */}
      <div className="mx-auto flex w-full max-w-391 items-center justify-between px-4 py-3.75 md:hidden">
        <PublicHeaderLogo variant="mobile" />

        <div className="flex items-start gap-2 pt-1">
          {actionIcons.map((item) => (
            <PublicHeaderActionIcon
              buttonClass={iconButtonClass}
              invertColors
              key={item.label}
              {...item}
            />
          ))}

          <PublicHeaderMobileMenu
            iconButtonClass={`${iconButtonClass} text-white`}
            links={publicLinks.map(({ href, label }) => ({ href, label }))}
          />
        </div>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden w-full max-w-391 grid-cols-[1fr_auto_1fr] items-center gap-6 md:grid md:h-23.25 md:px-8">
        <PublicHeaderLogo variant="desktop" />

        <PublicHeaderNav links={publicLinks} />

        <div className="order-2 flex h-9 w-[284.36px] flex-none grow-0 items-center justify-self-end gap-4">
          <div className="flex h-9 w-29 flex-none items-start gap-4 pt-1">
            {actionIcons.map((item) => (
              <PublicHeaderActionIcon
                buttonClass={iconButtonClass}
                key={item.label}
                {...item}
              />
            ))}
          </div>

          <PublicHeaderAuthButtons />
        </div>
      </div>
    </header>
  );
}
