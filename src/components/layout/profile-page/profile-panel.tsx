import type { ReactNode } from "react";

const PANEL_TONES = {
  kraft: "bg-[#faf8f2]",
  white: "bg-white",
} as const;

export const profilePrimaryActionClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow";

export const profileSecondaryActionClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-white px-5 text-xs font-black uppercase tracking-[0.18em] text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transition-shadow hover:shadow-[1px_1px_0px_#1a1a1a] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]";

export const profileQuietActionClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a]/25 bg-transparent px-5 text-xs font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 transition-colors hover:border-[#1a1a1a] hover:text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]";

export const profileDangerActionClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#c0392b] bg-white px-5 text-xs font-black uppercase tracking-[0.18em] text-[#c0392b] shadow-[3px_3px_0px_#c0392b] transition-shadow hover:shadow-[1px_1px_0px_#c0392b] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c0392b]";

export const profileFieldLabelClass =
  "block text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]";

export const profileInputClass =
  "h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm font-semibold text-[#1a1a1a] placeholder:font-medium placeholder:text-[#1a1a1a]/45 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-yellow disabled:bg-[#1a1a1a]/6 disabled:text-[#1a1a1a]/55";

/**
 * Superfície base do painel do comprador: papel kraft, borda dura e sombra sem blur.
 * É o mesmo corpo usado pelos painéis de vendor e admin.
 */
export function ProfilePanel({
  accent = false,
  children,
  className = "",
  tone = "kraft",
}: Readonly<{
  accent?: boolean;
  children: ReactNode;
  className?: string;
  tone?: keyof typeof PANEL_TONES;
}>) {
  return (
    <div
      className={`border-2 border-[#1a1a1a] ${PANEL_TONES[tone]} shadow-[8px_8px_0px_#1a1a1a] ${className}`}
    >
      {accent ? <div aria-hidden className="h-2 w-full bg-brand-yellow" /> : null}
      {children}
    </div>
  );
}

/**
 * Faixa preta de cabeçalho de um painel, com título em amarelo e descrição opcional.
 */
export function ProfilePanelHeader({
  action,
  description,
  headingId,
  level = "h2",
  title,
}: Readonly<{
  action?: ReactNode;
  description?: string;
  headingId?: string;
  level?: "h1" | "h2" | "h3";
  title: string;
}>) {
  const Heading = level;

  return (
    <header className="flex flex-col gap-4 border-b-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-5 md:flex-row md:items-end md:justify-between md:px-6">
      <div className="min-w-0">
        <Heading
          className="text-xl font-black uppercase tracking-tight text-brand-yellow md:text-2xl"
          id={headingId}
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#f5f1e8]/75">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/**
 * Placa de título de uma rota do painel, usada acima de listas e grades.
 * Não envolve o conteúdo, para não empilhar um painel dentro de outro.
 */
export function ProfilePageTitle({
  action,
  description,
  title,
}: Readonly<{ action?: ReactNode; description?: string; title: string }>) {
  return (
    <div className="flex flex-col gap-4 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a] md:flex-row md:items-end md:justify-between md:px-6">
      <div className="min-w-0">
        <h2 className="text-xl font-black uppercase tracking-tight text-brand-yellow md:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#f5f1e8]/75">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * Corpo padrão de um painel, com o respiro usado em todo o painel do comprador.
 */
export function ProfilePanelBody({
  children,
  className = "",
}: Readonly<{ children: ReactNode; className?: string }>) {
  return <div className={`px-5 py-6 md:px-6 md:py-7 ${className}`}>{children}</div>;
}

/**
 * Título de sub-seção dentro de um painel, marcado pelo losango amarelo da marca.
 */
export function ProfileSectionHeading({
  children,
  id,
}: Readonly<{ children: ReactNode; id?: string }>) {
  return (
    <h3
      className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]"
      id={id}
    >
      <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rotate-45 bg-brand-yellow" />
      {children}
    </h3>
  );
}
