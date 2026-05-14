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
    <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-[#cec7aa] bg-[#fff9ea]/95 px-4 py-4 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="flex w-full items-center justify-between gap-3">
        <button
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-transparent px-4 py-2 text-[12px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#ba1a1a] transition-all hover:border-[#ba1a1a] hover:bg-[#ffdad6] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="h-5 w-5" strokeWidth={2} />
          {isDeleting ? "Removendo..." : "Remover Campanha"}
        </button>
        <button
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#1e1c10] bg-[#1e1c10] px-6 py-2 text-[12px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#fee400] shadow-sm transition-colors hover:bg-[#1e1c10]/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={saveDisabled}
          onClick={onSave}
          type="button"
        >
          <Send className="h-5 w-5" strokeWidth={2} />
          {isSaving ? "Salvando..." : "Salvar Campanha"}
        </button>
      </div>
    </div>
  );
}
