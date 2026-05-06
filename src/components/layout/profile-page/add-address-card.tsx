"use client";

type AddAddressCardProps = {
  /** Callback ao clicar para adicionar endereco */
  onClick?: () => void;
};

/**
 * Card para adicionar novo endereco.
 *
 * Exibe um card com estilo tracejado e icone de adicao
 * que permite ao usuario iniciar o cadastro de um novo endereco.
 *
 * @example
 * ```tsx
 * <AddAddressCard onClick={() => openModal()} />
 * ```
 */
export function AddAddressCard({ onClick }: AddAddressCardProps) {
  return (
    <button
      className="flex min-h-53 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
      onClick={onClick}
      type="button"
    >
      {/* Icone de adicao */}
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
        <span className="text-2xl font-medium text-text-muted">+</span>
      </div>

      {/* Texto */}
      <span className="text-sm font-medium text-text-muted">
        Adicionar endereco
      </span>
    </button>
  );
}
