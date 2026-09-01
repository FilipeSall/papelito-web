"use client";

import type { ReactNode } from "react";

import { CheckIcon, CopyIcon } from "./checkout-icons";

const ACTION_BASE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-xs font-black uppercase tracking-[0.14em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark";

/**
 * Marcador de seção da marca: losango amarelo antes de um título em caixa alta.
 */
export function PaymentSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45 bg-brand-yellow" />
      <h3 className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">{children}</h3>
    </div>
  );
}

/**
 * Placa de destaque do método: fundo branco, borda grossa e sombra dura amarela.
 * Carrega o dado que o cliente leva para o banco — o QR Code no Pix, a linha
 * digitável no boleto — para que os dois métodos tenham o mesmo peso visual.
 */
export function PaymentPlaque({
  caption,
  children,
  className = "",
}: {
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`h-fit border-2 border-brand-dark bg-white p-3 shadow-[6px_6px_0px_#ffe500] ${className}`}
    >
      <div className="flex items-center justify-center">{children}</div>
      <p className="mt-3 text-center text-[10px] font-black uppercase leading-3 tracking-[0.18em] text-brand-dark">
        {caption}
      </p>
    </div>
  );
}

/**
 * Linha digitável do boleto quebrada nos próprios campos, para nunca partir um
 * grupo de dígitos no meio.
 */
export function PaymentDigitableLine({ value }: { value: string }) {
  return (
    <span className="block w-full py-4 text-center font-mono text-[15px] font-medium leading-7 tracking-[-0.01em] text-brand-dark">
      {value.split(/\s+/).map((group, index) => (
        <span className="mr-2 inline-block" key={`${group}-${index}`}>
          {group}
        </span>
      ))}
    </span>
  );
}

/**
 * Passo a passo numerado do pagamento.
 */
export function PaymentSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2.5">
      {steps.map((step, index) => (
        <li className="flex gap-3" key={step}>
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[10px] font-black text-brand-yellow"
          >
            {index + 1}
          </span>
          <span className="text-sm leading-5 tracking-[-0.1504px] text-text-secondary">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Bloco somente leitura com o código de pagamento em fonte monoespaçada.
 */
export function PaymentCodeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-dark">{label}</p>
      <p className="mt-2 max-h-28 overflow-y-auto break-all rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 font-mono text-xs leading-5 text-brand-dark">
        {value}
      </p>
    </div>
  );
}

/**
 * Linha de ações do método. O botão de copiar é a ação primária dos dois
 * métodos; o link opcional abre o boleto.
 */
export function PaymentActions({
  copyLabel,
  linkHref,
  linkIcon,
  linkLabel,
  onCopy,
  state,
}: {
  copyLabel: string;
  linkHref?: string;
  linkIcon?: ReactNode;
  linkLabel?: string;
  onCopy: () => void;
  state: "idle" | "copied" | "failed";
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className={`${ACTION_BASE} cursor-pointer bg-brand-yellow text-brand-dark hover:brightness-95`}
        onClick={onCopy}
        type="button"
      >
        <CopyIcon />
        {copyLabel}
      </button>

      {linkHref && linkLabel ? (
        <a
          className={`${ACTION_BASE} border border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white`}
          href={linkHref}
          rel="noreferrer"
          target="_blank"
        >
          {linkIcon}
          {linkLabel}
        </a>
      ) : null}

      <span aria-live="polite" className="inline-flex min-h-4 items-center">
        {state === "copied" ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#15803D]">
            <CheckIcon className="h-3.5 w-3.5" />
            Copiado
          </span>
        ) : null}
        {state === "failed" ? (
          <span className="text-xs font-semibold text-[#B42318]">
            ⚠ Não foi possível copiar. Selecione o código acima.
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * Moldura compartilhada pelos blocos de pagamento e de recibo: cabeçalho com o
 * assunto e uma data à direita, a placa de destaque à esquerda e as instruções
 * à direita.
 */
export function PaymentMethodPanel({
  asideLabel,
  asideTitle,
  children,
  icon,
  label,
  plaque,
  sublabel,
}: {
  asideLabel: string;
  asideTitle: string;
  children: ReactNode;
  icon: ReactNode;
  label: string;
  plaque: ReactNode;
  sublabel: string;
}) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFD]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-yellow text-brand-dark">
            {icon}
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">{label}</p>
            <p className="text-xs leading-4 text-text-tertiary">{sublabel}</p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-tertiary">
            {asideTitle}
          </p>
          <p className="text-sm font-black tracking-[-0.1504px] text-brand-dark">{asideLabel}</p>
        </div>
      </header>

      <div className="grid items-start gap-6 p-5 md:grid-cols-[auto_minmax(0,1fr)] md:gap-8 md:p-6">
        <div className="flex justify-center md:justify-start">{plaque}</div>
        <div className="min-w-0 space-y-5">{children}</div>
      </div>
    </section>
  );
}
