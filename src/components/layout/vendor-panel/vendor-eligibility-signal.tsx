import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import type { VendorPendingItem } from "@/features/vendor-eligibility/server";

/** Âncora do painel de pendências no dashboard, destino de todo indicador da navegação. */
export const VENDOR_PENDENCIES_HREF = "/vendor/dashboard#pendencias";

function pendingSentence(items: VendorPendingItem[]) {
  return items.map((item) => item.title).join("; ");
}

/**
 * Marcador de pendência colado ao item de navegação que a resolve.
 *
 * Carrega o triângulo de alerta e um texto só para leitor de tela, então o estado sobrevive sem
 * cor e é anunciado junto do nome do item quando o link recebe o foco. O `title` é reforço para
 * quem usa mouse, nunca a única via.
 */
export function VendorNavPendingMark({
  items,
}: Readonly<{ items: VendorPendingItem[] }>) {
  const sentence = pendingSentence(items);

  return (
    <>
      <span
        aria-hidden
        className="inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center border-2 border-[#c0392b] bg-[#c0392b] text-white"
        title={sentence}
      >
        <TriangleAlert className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
      <span className="sr-only">{`Pendência: ${sentence}`}</span>
    </>
  );
}

/**
 * Aviso único no topo da navegação da sidebar.
 *
 * É o indicador geral: diz que a loja não vende, conta quantas pendências existem e leva ao
 * painel que explica cada uma. Fica acima dos itens porque o vendor precisa vê-lo antes de
 * escolher para onde ir, e não compete com o amarelo do item ativo.
 */
export function VendorNavPendingAlert({
  count,
}: Readonly<{ count: number }>) {
  return (
    <Link
      className="group mb-3 flex items-start gap-3 rounded-[18px] border-2 border-[#c0392b] bg-[#c0392b]/16 px-4 py-3 text-left transition hover:bg-[#c0392b]/28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
      href={VENDOR_PENDENCIES_HREF}
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c0392b] text-white">
        <TriangleAlert aria-hidden className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <span>
        <span
          className="block text-sm font-semibold uppercase tracking-[0.12em] text-white"
          style={{ fontFamily: "var(--font-admin-display)" }}
        >
          Sua loja não vende
        </span>
        <span className="block text-xs text-white/72">
          {count === 1 ? "1 pendência a resolver" : `${count} pendências a resolver`}
        </span>
      </span>
    </Link>
  );
}

/**
 * Versão do aviso para a barra de seções abaixo de `lg`.
 *
 * Entra como primeiro chip da barra rolável, na mesma altura dos outros, para o vendor de celular
 * encontrar o aviso no lugar em que já procura navegação.
 */
export function VendorNavPendingChip({ count }: Readonly<{ count: number }>) {
  return (
    <Link
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-[#c0392b] bg-[#c0392b] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
      href={VENDOR_PENDENCIES_HREF}
    >
      <TriangleAlert aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
      {count === 1 ? "1 pendência" : `${count} pendências`}
    </Link>
  );
}
