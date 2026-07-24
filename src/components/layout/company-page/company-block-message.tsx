"use client";

import Link from "next/link";

type CompanyBlockMessageProps = {
  title: string;
  body: string;
  cta?: { href: string; label: string };
};

/**
 * Banner de bloqueio claro (sem empresa, em análise, sem permissão, seleção necessária).
 * Estética Papelito: fundo kraft, borda dura, sombra sem blur.
 */
export function CompanyBlockMessage({ title, body, cta }: CompanyBlockMessageProps) {
  return (
    <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] p-6 shadow-[6px_6px_0px_#1a1a1a]">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          {title}
        </h4>
      </div>
      <p className="text-sm font-medium text-[#231f20]">{body}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-4 inline-flex items-center bg-[#1a1a1a] px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
