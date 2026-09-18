import Link from "next/link";

import { FOCUS_RING } from "@/components/layout/admin-panel/primitives";
import {
  BRASPRESS_MIN_ACTIVE_PROFILES,
  type PackagingReadiness,
} from "@/features/vendor-packaging/utils/packaging-readiness";

import { PackagingDispatchGlyph, PackagingMissingDataGlyph } from "./packaging-glyphs";

/** Produtos do vendor que ainda não têm peso ou dimensão cadastrados na Papelito. */
export type PackagingPhysicalDataGap = {
  /** A contagem parou no teto da consulta e o número real pode ser maior. */
  capped: boolean;
  count: number;
};

function braspressLine(activeCount: number): string {
  if (activeCount >= BRASPRESS_MIN_ACTIVE_PROFILES) {
    return "A Braspress já encontra caixa para cotar os seus pedidos.";
  }

  return `A Braspress usa as suas caixas para cotar, e trabalha melhor a partir de ${BRASPRESS_MIN_ACTIVE_PROFILES}. Sem nenhuma caixa que sirva, ela não devolve preço.`;
}

function gapLine(gap: PackagingPhysicalDataGap): string {
  if (gap.count === 0) {
    return "Todos os produtos consultados já têm peso e medida na Papelito.";
  }

  const prefixo = gap.capped ? "Pelo menos " : "";
  const sufixo = gap.count === 1 ? "produto seu está" : "produtos seus estão";

  return `${prefixo}${gap.count} ${sufixo} sem peso ou medida cadastrados. Nenhuma caixa resolve isso: sem esse dado o frete não é calculado.`;
}

function Stat({
  children,
  glyph: Glyph,
  value,
}: Readonly<{
  children: React.ReactNode;
  glyph: (props: { className?: string }) => React.ReactElement;
  value: string;
}>) {
  return (
    <div className="flex items-start gap-4 px-5 py-4 md:px-6">
      <Glyph className="mt-0.5 h-8 w-8 shrink-0 text-[#1a1a1a]" />
      <div className="min-w-0">
        <p
          className="text-[2rem] leading-none font-semibold tracking-[0.06em] text-[#1a1a1a] uppercase tabular-nums"
          data-numeric
          style={{ fontFamily: "var(--font-admin-display)" }}
        >
          {value}
        </p>
        <p className="mt-2 text-xs leading-5 text-[#4a5565]">{children}</p>
      </div>
    </div>
  );
}

/**
 * Barra de prontidão do rodapé: o que as caixas cadastradas permitem despachar hoje.
 *
 * Os dois números dizem coisas diferentes de propósito. O primeiro é sobre as caixas; o segundo é
 * sobre o cadastro do produto na Papelito, que nenhuma caixa conserta — por isso ele leva para o
 * estoque, onde o vendor pede o dado que falta.
 *
 * A barra relata prontidão, não a caixa que sairia em cada pedido: resolver isso é do WordPress, e
 * a rota não existe. O título promete exatamente o que os dois números entregam.
 */
export function PackagingReadinessBar({
  gap,
  readiness,
}: Readonly<{ gap: PackagingPhysicalDataGap; readiness: PackagingReadiness }>) {
  return (
    <section className="border-2 border-[#1a1a1a] bg-[#fbf7ef] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-[#1a1a1a]" />
      <div className="border-b-2 border-[#1a1a1a] px-5 py-3 md:px-6">
        <p className="text-[10px] font-black tracking-[0.22em] text-[#231f20]/55 uppercase">
          Prontidão da embalagem
        </p>
      </div>
      <div className="grid divide-y-2 divide-[#1a1a1a]/10 md:grid-cols-2 md:divide-x-2 md:divide-y-0">
        <Stat glyph={PackagingDispatchGlyph} value={`${readiness.activeCount} de ${BRASPRESS_MIN_ACTIVE_PROFILES}`}>
          {braspressLine(readiness.activeCount)}
        </Stat>
        <Stat glyph={PackagingMissingDataGlyph} value={gap.capped ? `${gap.count}+` : String(gap.count)}>
          {gapLine(gap)}
          {gap.count > 0 ? (
            <>
              {" "}
              <Link
                className={[
                  "font-black tracking-[0.1em] text-[#1a1a1a] uppercase underline underline-offset-4",
                  FOCUS_RING,
                ].join(" ")}
                href="/vendor/estoque?filter=incomplete"
              >
                Ver no estoque
              </Link>
            </>
          ) : null}
        </Stat>
      </div>
    </section>
  );
}
