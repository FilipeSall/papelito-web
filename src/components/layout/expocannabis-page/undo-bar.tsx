type UndoBarProps = {
  text: string;
  onUndo: () => void;
};

/** Barra escura de 5 s com "Desfazer" amarelo depois de uma remoção ou da saída automática do kit. */
export function UndoBar({ text, onUndo }: Readonly<UndoBarProps>) {
  return (
    <div role="status" aria-label="Desfazer remoção" className="expo-undo-in flex items-center gap-3 rounded-lg bg-[#231F20] py-2 pl-3.5 pr-2 text-white">
      <p className="min-w-0 flex-1 text-sm font-bold">{text}</p>
      <button
        type="button"
        onClick={onUndo}
        className="min-h-11 flex-none rounded-md bg-brand-yellow px-3.5 text-sm font-extrabold text-[#231F20] focus-visible:outline-brand-yellow"
      >
        Desfazer
      </button>
    </div>
  );
}
