import type { ReactNode } from "react";

import { CheckoutStepper } from "./checkout-stepper";

type CheckoutLayoutProps = {
  current: 1 | 2 | 3;
  title: string;
  /** Texto ou linha de total logo abaixo do título. */
  intro: ReactNode;
  /** Link "← Voltar ..." acima do título; some quando não houver para onde voltar. */
  back?: { label: string; onBack: () => void };
  /** Espaço entre as seções: 22 px na tela de dados, 20 px na de pagamento. */
  spacing?: "form" | "payment";
  /** Coluna fixa de 360 px na paisagem; no retrato desce para o fim do conteúdo ou some, conforme o chamador. */
  aside?: ReactNode;
  /** Conteúdo do rodapé fixo: avisos e CTA. */
  footer: ReactNode;
  children: ReactNode;
};

const SPACING = { form: "gap-5.5", payment: "gap-5" };

/** Casca das telas 03 e 04: conteúdo que rola, resumo fixo na paisagem e rodapé com o CTA sempre visível. */
export function CheckoutLayout({ current, title, intro, back, spacing = "form", aside, footer, children }: Readonly<CheckoutLayoutProps>) {
  const gap = SPACING[spacing];
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1 overflow-y-auto px-8 pt-5 pb-6">
        <div className={`grid items-start ${gap} min-[1024px]:grid-cols-[minmax(0,1fr)_360px] min-[1024px]:gap-x-8`}>
          <div className={`flex min-w-0 flex-col ${gap}`}>
            <CheckoutStepper current={current} />
            <div>
              {back ? (
                <button type="button" onClick={back.onBack} className="inline-flex min-h-11 items-center text-[15px] font-bold underline underline-offset-3">
                  {`← ${back.label}`}
                </button>
              ) : null}
              <h1 className="mt-1 text-[30px] font-extrabold">{title}</h1>
              {intro}
            </div>
            {children}
          </div>
          {aside}
        </div>
      </div>
      <footer className="flex-none border-t border-[#E4E4E7] px-8 pt-3.5 pb-5.5">{footer}</footer>
    </div>
  );
}

/** Aside que fica preso ao topo da área que rola, na paisagem. */
export function StickyAside({ children, landscapeOnly = false }: Readonly<{ children: ReactNode; landscapeOnly?: boolean }>) {
  return <div className={`min-[1024px]:sticky min-[1024px]:top-0 ${landscapeOnly ? "hidden min-[1024px]:block" : ""}`}>{children}</div>;
}

type CheckoutCtaProps = {
  children: string;
  disabled?: boolean;
  onClick: () => void;
};

/** CTA amarelo do rodapé: 60 px, sem sombra, encolhe a 98% ao toque. */
export function CheckoutCta({ children, disabled = false, onClick }: Readonly<CheckoutCtaProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-15 w-full items-center justify-center rounded-lg bg-brand-yellow text-lg font-extrabold transition-transform duration-120 enabled:active:scale-98 disabled:opacity-60 motion-reduce:transition-none"
    >
      {children}
    </button>
  );
}
