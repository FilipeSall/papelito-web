import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { FOCUS_RING } from "./focus-ring";

/**
 * Cabeçalho no mesmo desenho da Taxonomia: losango amarelo, título em caixa alta, uma linha de
 * contexto e a ação primária à direita. Sem caixa de contagem — o número vive no segmento ativo.
 */
export function SectionHeading({
  action,
  description,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
            {title}
          </h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#231f20]/70">{description}</p>
      </div>
      {action}
    </header>
  );
}

/**
 * Moldura única de resultados: faixa amarela, borda 2px e sombra dura — a mesma do card de
 * categoria. As linhas moram dentro dela em vez de virarem um card cada, para a página não somar
 * dezenas de sombras concorrendo.
 */
export function ResultFrame({
  action,
  children,
  footer,
  id,
  notice,
  summary,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  id?: string;
  notice?: React.ReactNode;
  summary: string;
}) {
  return (
    <section
      className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
      id={id}
    >
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a1a1a] px-5 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55">
          {summary}
        </p>
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      {notice ? <div className="border-b-2 border-[#1a1a1a]/10 px-5 py-3">{notice}</div> : null}
      <ul className="divide-y-2 divide-[#1a1a1a]/10">{children}</ul>
      {footer ? (
        <div className="border-t-2 border-[#1a1a1a] px-5 py-3">{footer}</div>
      ) : null}
    </section>
  );
}

/**
 * Linha de resultado. `lead` é a identidade da entidade, `meta` o relacionamento e `trailing` o
 * estado mais a ação — sempre nessa ordem, nos três segmentos.
 */
export function ResultRow({
  href,
  lead,
  meta,
  trailing,
}: {
  href: string;
  lead: React.ReactNode;
  meta?: React.ReactNode;
  trailing: React.ReactNode;
}) {
  return (
    <li className="group relative bg-[#faf8f2] transition hover:bg-white">
      <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">{lead}</div>
        {meta ? <div className="min-w-0 lg:w-[34%]">{meta}</div> : null}
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">{trailing}</div>
      </div>
      <Link
        aria-label="Abrir registro"
        className={["absolute inset-0", FOCUS_RING].join(" ")}
        href={href}
      >
        <span className="sr-only">Abrir</span>
      </Link>
    </li>
  );
}

/**
 * Variante de `ResultRow` para linha que abre um editor em vez de navegar.
 *
 * O overlay é um `button`, não um link: a linha não tem URL própria, e um link com `href="#"`
 * mentiria para o teclado e para o leitor de tela.
 */
export function ResultButtonRow({
  ariaLabel,
  lead,
  meta,
  onOpen,
  trailing,
}: {
  ariaLabel: string;
  lead: React.ReactNode;
  meta?: React.ReactNode;
  onOpen: () => void;
  trailing: React.ReactNode;
}) {
  return (
    <li className="group relative bg-[#faf8f2] transition hover:bg-white">
      <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">{lead}</div>
        {meta ? <div className="min-w-0 lg:w-[30%]">{meta}</div> : null}
        <div className="relative z-10 flex flex-wrap items-center gap-3 lg:justify-end">
          {trailing}
        </div>
      </div>
      <button
        aria-label={ariaLabel}
        className={["absolute inset-0", FOCUS_RING].join(" ")}
        onClick={onOpen}
        type="button"
      >
        <span className="sr-only">{ariaLabel}</span>
      </button>
    </li>
  );
}

export function EmptyResult({ body, title }: { body: string; title: string }) {
  return (
    <div className="border-2 border-dashed border-[#1a1a1a] bg-[#faf8f2] px-6 py-12 text-center">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#231f20]/64">{body}</p>
    </div>
  );
}

export function InlineAlert({
  children,
  icon: Icon,
  tone = "warning",
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  tone?: "critical" | "warning";
}) {
  return (
    <p
      className={[
        "flex items-center gap-2 border-2 bg-white px-4 py-3 text-sm font-semibold",
        tone === "critical" ? "border-[#c0392b] text-[#c0392b]" : "border-[#1a1a1a] text-[#1a1a1a]",
      ].join(" ")}
    >
      {Icon ? <Icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} /> : null}
      {children}
    </p>
  );
}

const PRIMARY_ACTION_CLASS =
  "inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none";

export function PrimaryLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link className={[PRIMARY_ACTION_CLASS, FOCUS_RING].join(" ")} href={href}>
      {children}
    </Link>
  );
}

/**
 * Mesma presença visual de `PrimaryLink` para a ação primária que não navega.
 */
export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      className={[PRIMARY_ACTION_CLASS, FOCUS_RING].join(" ")}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
