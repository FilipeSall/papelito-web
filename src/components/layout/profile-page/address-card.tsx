"use client";

type Address = {
  /** Identificador unico do endereco */
  id: string;
  /** Nome/apelido do endereco (Casa, Trabalho, etc) */
  name: string;
  /** Logradouro com numero e complemento */
  street: string;
  /** Bairro e cidade com estado */
  neighborhood: string;
  /** Codigo postal */
  zipCode: string;
  /** Se este e o endereco principal */
  isDefault?: boolean;
};

type AddressCardProps = {
  /** Dados do endereco */
  address: Address;
  /** Callback ao clicar em editar */
  onEdit?: (id: string) => void;
  /** Callback ao clicar em remover */
  onRemove?: (id: string) => void;
};

/**
 * Icone de localizacao para o card de endereco.
 */
function LocationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="20"
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.5 8.33333C17.5 14.1667 10 19.1667 10 19.1667C10 19.1667 2.5 14.1667 2.5 8.33333C2.5 6.34421 3.29018 4.43655 4.6967 3.03003C6.10322 1.62351 8.01088 0.833332 10 0.833332C11.9891 0.833332 13.8968 1.62351 15.3033 3.03003C16.7098 4.43655 17.5 6.34421 17.5 8.33333Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M10 10.8333C11.3807 10.8333 12.5 9.71404 12.5 8.33333C12.5 6.95262 11.3807 5.83333 10 5.83333C8.61929 5.83333 7.5 6.95262 7.5 8.33333C7.5 9.71404 8.61929 10.8333 10 10.8333Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Card de endereco do usuario.
 *
 * Exibe informacoes de um endereco cadastrado com opcoes
 * de edicao e remocao. Destaca visualmente o endereco principal.
 *
 * @example
 * ```tsx
 * <AddressCard
 *   address={{
 *     id: "1",
 *     name: "Casa",
 *     street: "Rua das Flores, 123 - Apto 45",
 *     neighborhood: "Vila Mariana, Sao Paulo - SP",
 *     zipCode: "04101-000",
 *     isDefault: true,
 *   }}
 *   onEdit={(id) => console.log("Editar", id)}
 *   onRemove={(id) => console.log("Remover", id)}
 * />
 * ```
 */
export function AddressCard({ address, onEdit, onRemove }: AddressCardProps) {
  const shadowClass = address.isDefault
    ? "shadow-[8px_8px_0px_#ffe500]"
    : "shadow-[8px_8px_0px_#1a1a1a]";

  return (
    <div
      className={`relative rounded-none border-2 border-[#1a1a1a] bg-white p-6 ${shadowClass}`}
    >
      {/* Badge Principal */}
      {address.isDefault && (
        <span className="absolute right-4 top-4 border-2 border-[#1a1a1a] bg-brand-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
          Principal
        </span>
      )}

      {/* Icone */}
      <LocationIcon className="mb-4 h-5 w-5 text-[#1a1a1a]" />

      {/* Nome do endereço */}
      <h3 className="mb-2 text-base font-black uppercase tracking-tight text-[#1a1a1a]">
        {address.name}
      </h3>

      {/* Detalhes do endereço */}
      <div className="mb-4 space-y-0.5 text-sm text-[#1a1a1a]/70">
        <p>{address.street}</p>
        <p>{address.neighborhood}</p>
        <p>CEP: {address.zipCode}</p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest">
        <button
          className="cursor-pointer text-[#1a1a1a] transition-colors hover:text-[#1a1a1a]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
          onClick={() => onEdit?.(address.id)}
          type="button"
        >
          Editar
        </button>
        <span className="text-[#1a1a1a]/20">|</span>
        <button
          className="cursor-pointer text-[#c0392b] transition-colors hover:text-[#c0392b]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
          onClick={() => onRemove?.(address.id)}
          type="button"
        >
          Remover
        </button>
      </div>
    </div>
  );
}

export type { Address };
