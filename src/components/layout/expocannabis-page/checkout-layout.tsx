import type { ReactNode } from "react";

import { CheckoutStepper } from "./checkout-stepper";
import { Paper } from "./paper";

type CheckoutLayoutProps = {
  current: 1 | 2 | 3;
  title: string;
  /** Texto ou linha de total logo abaixo do título. */
  intro: ReactNode;
  /** Link "← Voltar ..." acima do título; some quando não houver para onde voltar. */
  back?: { label: string; onBack: () => void };
  /** Espaço entre as seções: 22 px na tela de dados, 20 px na de pagamento. */
  spacing?: "form" | "payment";
  /** Papel recortado do handoff atrás do conteúdo claro. */
  paper: string;
  /** Coluna fixa na paisagem; no retrato desce para o fim do conteúdo ou some, conforme o chamador. */
  aside?: ReactNode;
  /** Conteúdo do rodapé fixo: avisos e CTA. */
  footer: ReactNode;
  children: ReactNode;
};

const SPACING = { form: "gap-5.5", payment: "gap-5" };

/**
 * Casca das telas 03 e 04: papel claro que rola, resumo fixo na paisagem e rodapé escuro
 * com o CTA sempre visível. O papel fica atrás de tudo, então o miolo é `relative`.
 */
export function CheckoutLayout({ current, title, intro, back, spacing = "form", paper, aside, footer, children }: Readonly<CheckoutLayoutProps>) {
  const gap = SPACING[spacing];

  return (
    <div className="flex h-full flex-col bg-expo-noite">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* O papel envolve o conteudo inteiro, e nao a janela de rolagem: se ele ficasse
            na janela, a borda rasgada cairia no meio da tela assim que a pagina rolasse. */}
        <div className="relative min-h-full">
          <Paper src={paper} />
          <div className="em-claro relative px-6 pb-6 pt-5 text-expo-ink sm:px-8">
          <div className={`grid items-start ${gap} pz:grid-cols-[minmax(0,1fr)_400px] pz:gap-x-8`}>
            <div className={`flex min-w-0 flex-col ${gap}`}>
              <CheckoutStepper current={current} />
              <div>
                {back ? (
                  <button type="button" onClick={back.onBack} className="inline-flex min-h-11 items-center text-[15px] font-extrabold underline underline-offset-4">
                    {`← ${back.label}`}
                  </button>
                ) : null}
                <h1 className="ultra mt-1 text-[32px] leading-10 sm:text-[40px] sm:leading-12">{title}</h1>
                {intro}
              </div>
              {children}
            </div>
              {aside}
            </div>
          </div>
        </div>
      </div>
      <footer className="flex-none bg-expo-noite px-6 pb-5.5 pt-3.5 sm:px-8">{footer}</footer>
    </div>
  );
}

/** Aside que fica preso ao topo da área que rola, na paisagem. */
export function StickyAside({ children, landscapeOnly = false }: Readonly<{ children: ReactNode; landscapeOnly?: boolean }>) {
  return <div className={`pz:sticky pz:top-0 ${landscapeOnly ? "hidden pz:block" : ""}`}>{children}</div>;
}

type CheckoutCtaProps = {
  children: string;
  disabled?: boolean;
  onClick: () => void;
};

/** CTA amarelo do rodapé: 60 px, canto reto, sem sombra. */
export function CheckoutCta({ children, disabled = false, onClick }: Readonly<CheckoutCtaProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-15 w-full items-center justify-center bg-brand-yellow text-[18px] font-extrabold text-expo-ink disabled:bg-expo-cinza disabled:text-expo-zinc"
    >
      {children}
    </button>
  );
}
