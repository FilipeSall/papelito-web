import { Send } from "lucide-react";

import { FOCUS_RING } from "../../../primitives";

type ExpodayPublishBarProps = {
  /** Alterações do rascunho ainda não publicadas. */
  changeCount: number;
  /** Algum campo está inválido; publicar fica bloqueado. */
  blocked: boolean;
  saving: boolean;
  /** Quem publicou por último e quando, já formatado; vazio quando nunca houve publicação. */
  lastPublished: string;
  onDiscard: () => void;
  onPublish: () => void;
};

function statusText({ blocked, changeCount, lastPublished }: Pick<ExpodayPublishBarProps, "blocked" | "changeCount" | "lastPublished">): string {
  if (blocked) return "Corrija os campos em vermelho para publicar.";
  if (changeCount > 0) return "O estande cobra os preços novos na próxima cotação. O tablet mostra a vitrine nova ao recarregar.";
  return lastPublished || "Nenhum preço próprio publicado: o estande usa o preço do site.";
}

function countLabel(changeCount: number): string {
  if (changeCount === 0) return "Tudo publicado";
  return changeCount === 1 ? "1 alteração sem publicar" : `${changeCount} alterações sem publicar`;
}

/**
 * Barra fixa no rodapé da aba ExpoDay: quantas alterações faltam publicar, o motivo de bloqueio e
 * as ações. Nada muda no estande antes de "Publicar no estande".
 */
export function ExpodayPublishBar({ blocked, changeCount, lastPublished, onDiscard, onPublish, saving }: Readonly<ExpodayPublishBarProps>) {
  const canPublish = changeCount > 0 && !blocked && !saving;

  return (
    <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-4 border-2 border-[#1a1a1a] border-t-4 border-t-brand-yellow bg-[#1a1a1a] px-5 py-3 text-[#f5f1e8]">
      <p className="text-base font-semibold uppercase tracking-[0.06em]" style={{ fontFamily: "var(--font-admin-display)" }}>
        {countLabel(changeCount)}
      </p>
      <p className="min-w-56 flex-1 text-[13px] text-[#f5f1e8]/72" role="status">
        {statusText({ blocked, changeCount, lastPublished })}
      </p>
      <button
        className={`h-11 px-3 text-[11px] font-black uppercase tracking-[0.14em] underline underline-offset-4 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40 ${FOCUS_RING}`}
        disabled={changeCount === 0 || saving}
        onClick={onDiscard}
        type="button"
      >
        Descartar
      </button>
      <button
        className={`inline-flex h-11 items-center gap-2 border-2 border-[#f5f1e8] bg-brand-yellow px-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:border-[#a1a1aa] disabled:bg-[#e4e4e7] disabled:text-[#52525b] ${FOCUS_RING}`}
        disabled={!canPublish}
        onClick={onPublish}
        type="button"
      >
        <Send aria-hidden className="size-4" strokeWidth={2.4} />
        {saving ? "Publicando…" : "Publicar no estande"}
      </button>
    </div>
  );
}
