"use client";

import { AddAddressCard } from "./add-address-card";
import { Address, AddressCard } from "./address-card";

type AddressListProps = {
  /** Lista de enderecos do usuario */
  addresses: Address[];
  /** Callback ao clicar em editar um endereco */
  onEdit?: (id: string) => void;
  /** Callback ao clicar em remover um endereco */
  onRemove?: (id: string) => void;
  /** Callback ao clicar em adicionar novo endereco */
  onAdd?: () => void;
};

/**
 * Lista de enderecos do usuario.
 *
 * Exibe os enderecos cadastrados em um grid responsivo
 * com opcao de adicionar novos enderecos.
 *
 * @example
 * ```tsx
 * <AddressList
 *   addresses={addresses}
 *   onEdit={(id) => handleEdit(id)}
 *   onRemove={(id) => handleRemove(id)}
 *   onAdd={() => handleAdd()}
 * />
 * ```
 */
export function AddressList({
  addresses,
  onEdit,
  onRemove,
  onAdd,
}: AddressListProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-black uppercase tracking-tight text-brand-dark">
        Meus Enderecos
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {addresses.map((address) => (
          <AddressCard
            address={address}
            key={address.id}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
        <AddAddressCard onClick={onAdd} />
      </div>
    </div>
  );
}
