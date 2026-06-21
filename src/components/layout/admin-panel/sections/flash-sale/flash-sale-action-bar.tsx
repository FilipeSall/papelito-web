import { Send, Trash2 } from "lucide-react";

type FlashSaleActionBarProps = {
  canSave: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  onDelete: () => void;
  onSave: () => void;
};

export function FlashSaleActionBar({
  canSave,
  isDeleting,
  isSaving,
  onDelete,
  onSave,
}: FlashSaleActionBarProps) {
  const busy = isSaving || isDeleting;
  const saveDisabled = busy || !canSave;

  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t-2 border-[#1a1a1a] bg-[#faf8f2]/95 px-4 py-4 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="flex w-full items-center justify-between gap-3">
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 border-2 border-[#c0392b] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#c0392b] transition-colors hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
          {isDeleting ? "Removendo..." : "Remover Campanha"}
        </button>
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-6 py-2 text-[11px] font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={saveDisabled}
          onClick={onSave}
          type="button"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
          {isSaving ? "Salvando..." : "Salvar Campanha"}
        </button>
      </div>
    </div>
  );
}
