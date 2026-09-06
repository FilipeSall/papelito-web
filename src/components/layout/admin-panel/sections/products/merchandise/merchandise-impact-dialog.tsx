"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";

import { useEscapeKey } from "@/hooks/use-escape-key";
import type { AdminMerchandiseImpact } from "@/lib/server/admin-merchandise";

type MerchandiseImpactDialogProps = Readonly<{
  impact: AdminMerchandiseImpact;
  merchandiseName: string;
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
}>;

/**
 * Confirmação antes de uma alteração global despublicar Kits.
 *
 * Peso e dimensão de brinde entram na cotação dos Correios: um dígito a mais
 * derruba da vitrine todo Kit que o carrega. O admin vê a lista nominal antes.
 */
export function MerchandiseImpactDialog({
  impact,
  merchandiseName,
  onCancel,
  onConfirm,
  saving,
}: MerchandiseImpactDialogProps) {
  useEscapeKey(onCancel, { enabled: !saving });

  const affectedCount = impact.affectedKits.length;
  const breakingCount = impact.breakingKits.length;

  return (
    <div
      aria-labelledby="merchandise-impact-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#231f20]/70 p-4"
      role="dialog"
    >
      <section className="w-full max-w-lg border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0_#1a1a1a]">
        <div className="h-2 bg-[#c0392b]" />
        <header className="flex items-start gap-3 border-b-2 border-[#1a1a1a] px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center border-2 border-[#1a1a1a] bg-[#fff0ed] text-[#8b1f16]">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em]">
              Confirmação
            </p>
            <h3
              className="mt-1 text-xl font-black uppercase"
              id="merchandise-impact-title"
            >
              Esta alteração despublica Kits
            </h3>
          </div>
        </header>
        <div className="space-y-4 px-5 py-5 text-sm leading-6 text-[#5e574c]">
          <p>
            Alterar <strong className="text-[#231f20]">{merchandiseName}</strong>{" "}
            afeta {affectedCount} {affectedCount === 1 ? "Kit" : "Kits"} e faz{" "}
            {breakingCount} {breakingCount === 1 ? "deixar" : "deixarem"} de
            atender às regras de publicação:
          </p>
          <ul className="space-y-2 border-2 border-[#1a1a1a] bg-white p-3">
            {impact.breakingKits.map((kit) => (
              <li className="flex items-center gap-2 font-bold text-[#231f20]" key={kit.kitId}>
                <span aria-hidden className="size-2 rotate-45 bg-[#c0392b]" />
                {kit.name}
              </li>
            ))}
          </ul>
          <p className="border-2 border-[#1a1a1a] bg-brand-yellow px-3 py-2 text-xs font-bold leading-5 text-[#231f20]">
            Esses Kits voltam para rascunho e saem da vitrine até a logística
            voltar a fechar. Pedidos já feitos não mudam.
          </p>
        </div>
        <footer className="flex justify-end gap-3 border-t-2 border-[#1a1a1a] bg-white px-5 py-4">
          <button
            className="h-10 cursor-pointer border-2 border-[#1a1a1a] px-4 text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow disabled:opacity-50"
            disabled={saving}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#c0392b] px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50"
            disabled={saving}
            onClick={onConfirm}
            type="button"
          >
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {saving ? "Salvando…" : "Salvar mesmo assim"}
          </button>
        </footer>
      </section>
    </div>
  );
}
