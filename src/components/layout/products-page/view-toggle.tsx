import { ViewToggleGridIcon } from "./view-toggle-grid-icon";
import { ViewToggleListIcon } from "./view-toggle-list-icon";

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
        <ViewToggleGridIcon active={activeView === "grid"} />
      </button>
      <button
        type="button"
        aria-label="Visualização em lista"
        className={`p-1.5 rounded-md transition-colors ${
          activeView === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
        }`}
      >
        <ViewToggleListIcon active={activeView === "list"} />
      </button>
    </div>
  );
}
