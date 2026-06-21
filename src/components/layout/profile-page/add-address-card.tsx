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
      className="group flex min-h-53 cursor-pointer flex-col items-center justify-center gap-3 rounded-none border-2 border-dashed border-[#1a1a1a] bg-white p-6 transition-colors hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
      onClick={onClick}
      type="button"
    >
      {/* Icone de adicao */}
      <div className="flex h-10 w-10 items-center justify-center border-2 border-[#1a1a1a] bg-brand-yellow group-hover:bg-white">
        <span className="text-2xl font-black leading-none text-[#1a1a1a]">+</span>
      </div>

      {/* Texto */}
      <span className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]">
        Adicionar endereco
      </span>
    </button>
  );
}
