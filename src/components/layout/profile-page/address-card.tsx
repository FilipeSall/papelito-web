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
  const borderClass = address.isDefault
    ? "border-2 border-brand-yellow"
    : "border-2 border-gray-200";

  return (
    <div
      className={`relative rounded-2xl bg-white p-6 shadow-sm ${borderClass}`}
    >
      {/* Badge Principal */}
      {address.isDefault && (
        <span className="absolute right-4 top-4 rounded-full bg-brand-yellow px-2 py-1 text-xs font-black text-brand-dark">
          Principal
        </span>
      )}

      {/* Icone */}
      <LocationIcon className="mb-4 h-5 w-5 text-brand-dark" />

      {/* Nome do endereco */}
      <h3 className="mb-2 text-base font-black tracking-tight text-brand-dark">
        {address.name}
      </h3>

      {/* Detalhes do endereco */}
      <div className="mb-4 space-y-0.5 text-sm text-text-tertiary">
        <p>{address.street}</p>
        <p>{address.neighborhood}</p>
        <p>CEP: {address.zipCode}</p>
      </div>

      {/* Acoes */}
      <div className="flex items-center gap-2 text-xs">
        <button
          className="font-medium text-text-muted hover:text-text-secondary transition-colors"
          onClick={() => onEdit?.(address.id)}
          type="button"
        >
          Editar
        </button>
        <span className="text-gray-200">|</span>
        <button
          className="font-medium text-red-400 hover:text-red-500 transition-colors"
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
