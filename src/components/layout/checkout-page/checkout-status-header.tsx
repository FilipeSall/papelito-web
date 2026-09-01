import type { ReactNode } from "react";

const TONE = {
  brand: { marker: "bg-brand-yellow", label: "text-brand-yellow" },
  danger: { marker: "bg-[#FCA5A5]", label: "text-[#FCA5A5]" },
} as const;

/**
 * Faixa de identificação das etapas finais do checkout. Repete a linguagem do
 * cabeçalho do checkout (fundo escuro, título em caixa alta) sem o stepper,
 * porque as três etapas já foram concluídas quando o pedido chega aqui.
 */
export function CheckoutStatusHeader({
  aside,
  description,
  supraLabel,
  title,
  tone = "brand",
}: {
  aside?: ReactNode;
  description: string;
  supraLabel: string;
  title: string;
  tone?: keyof typeof TONE;
}) {
  const palette = TONE[tone];

  return (
    <section className="bg-brand-dark">
      <div className="mx-auto flex w-full max-w-391 flex-wrap items-start justify-between gap-6 px-6 pb-8 pt-8 md:px-8 md:pb-10 md:pt-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span aria-hidden className={`inline-block h-2.5 w-2.5 rotate-45 ${palette.marker}`} />
            <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${palette.label}`}>
              {supraLabel}
            </p>
          </div>

          <h1 className="mt-3 text-4xl font-black uppercase leading-10 tracking-[0.3691px] text-white">
            {title}
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-5 text-white/70">{description}</p>
        </div>

        {aside}
      </div>
    </section>
  );
}

/**
 * Cartão de apoio da faixa escura, usado para o prazo de pagamento e para o
 * total pago.
 */
export function CheckoutStatusAside({
  label,
  note,
  value,
}: {
  label: string;
  note?: string;
  value: string;
}) {
  return (
    <div className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 sm:w-auto sm:min-w-[236px]">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">{label}</p>
      <p
        aria-live="polite"
        className="mt-1.5 text-2xl font-black leading-7 tracking-[-0.4492px] text-brand-yellow"
      >
        {value}
      </p>
      {note ? <p className="mt-1 text-xs leading-4 text-white/70">{note}</p> : null}
    </div>
  );
}
