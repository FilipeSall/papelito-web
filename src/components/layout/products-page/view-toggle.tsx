/**
 * Ícone de grade (grid view).
 */
function GridIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="2"
        y="2"
        width="7"
        height="7"
        rx="1.5"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
      <rect
        x="11"
        y="2"
        width="7"
        height="7"
        rx="1.5"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
      <rect
        x="2"
        y="11"
        width="7"
        height="7"
        rx="1.5"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
      <rect
        x="11"
        y="11"
        width="7"
        height="7"
        rx="1.5"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
    </svg>
  );
}

/**
 * Ícone de lista (list view).
 */
function ListIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="2"
        y="3"
        width="16"
        height="4"
        rx="1"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
      <rect
        x="2"
        y="8"
        width="16"
        height="4"
        rx="1"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
      <rect
        x="2"
        y="13"
        width="16"
        height="4"
        rx="1"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
    </svg>
  );
}

type ViewMode = "grid" | "list";

interface ViewToggleProps {
  /** Modo de visualização atual */
  activeView?: ViewMode;
}

/**
 * Alternador de visualização entre grade e lista.
 *
 * Exibe dois botões de ícone para alternar entre visualização em grid
 * e visualização em lista. O modo ativo é destacado com cor escura.
 * Por enquanto, o toggle é apenas visual (estático).
 *
 * @example
 * ```tsx
 * <ViewToggle activeView="grid" />
 * ```
 */
export function ViewToggle({ activeView = "grid" }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        type="button"
        aria-label="Visualização em grade"
        className={`p-1.5 rounded-md transition-colors ${
          activeView === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
        }`}
      >
        <GridIcon active={activeView === "grid"} />
      </button>
      <button
        type="button"
        aria-label="Visualização em lista"
        className={`p-1.5 rounded-md transition-colors ${
          activeView === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
        }`}
      >
        <ListIcon active={activeView === "list"} />
      </button>
    </div>
  );
}
