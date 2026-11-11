type UndoBarProps = {
  text: string;
  onUndo: () => void;
};

/** Barra escura de 5 s com "Desfazer" depois de uma remoção ou da saída automática do kit. */
export function UndoBar({ text, onUndo }: Readonly<UndoBarProps>) {
  return (
    <div role="status" aria-label="Desfazer remoção" className="expo-rise flex items-center gap-4 rounded-md bg-[#231F20] px-4 py-3 text-white">
      <p className="flex-1 text-base font-semibold">{text}</p>
      <button type="button" onClick={onUndo} className="h-11 px-3 text-base font-extrabold text-brand-yellow">
        Desfazer
      </button>
    </div>
  );
}
