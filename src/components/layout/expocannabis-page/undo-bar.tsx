type UndoBarProps = {
  text: string;
  onUndo: () => void;
};

/** Aviso de 5 s com "Desfazer": papel branco, borda preta e sombra dura, como o resto do handoff. */
export function UndoBar({ text, onUndo }: Readonly<UndoBarProps>) {
  return (
    <div
      role="status"
      aria-label="Desfazer remoção"
      className="expo-sobe sombra-dura flex items-center gap-4 border-2 border-expo-ink bg-white px-4 py-3 text-expo-ink"
    >
      <p className="min-w-0 flex-1 text-[15px] font-bold">{text}</p>
      <button type="button" onClick={onUndo} className="min-h-11 flex-none bg-expo-noite px-4 text-[15px] font-extrabold text-brand-yellow">
        Desfazer
      </button>
    </div>
  );
}
