import { PackagePlus, Trash2 } from "lucide-react";
import Image from "next/image";

import { MenuUnderline } from "@/components/ui/menu-underline";
import type { AdminKit } from "@/lib/server/admin-kits";
import { formatBRL } from "@/lib/format-currency";

import { parseKitMoney } from "./kits-manager-draft";

type KitsListProps = Readonly<{
  kits: AdminKit[];
  onCreate: () => void;
  onDelete: (kit: AdminKit) => void;
  onEdit: (kit: AdminKit) => void;
  deletingKitId: number | null;
  error: string;
  notice: string;
}>;

export function KitsList({
  deletingKitId,
  error,
  kits,
  notice,
  onCreate,
  onDelete,
  onEdit,
}: KitsListProps) {
  return (
    <div className="space-y-5 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#6f6758]">
            <span>Papelito</span>
            <span aria-hidden>/</span>
            <span>Admin</span>
            <span aria-hidden>/</span>
            <span className="font-semibold text-[#231f20]">Kits</span>
          </div>
          <h2
            className="mt-3 text-[2.35rem] font-semibold leading-none tracking-[-0.04em] text-[#231f20]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Kits
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5e574c]">
            Monte ofertas próprias com produtos, preço e itens de merchandising.
          </p>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-brand-yellow px-4 text-[11px] font-black uppercase tracking-[0.14em] shadow-[4px_4px_0_#1a1a1a] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
          onClick={onCreate}
          type="button"
        >
          <PackagePlus className="size-4" />
          Criar Kit
        </button>
      </header>
      {notice ? (
        <output className="block border-2 border-[#275a1d] bg-[#eff8e9] px-4 py-3 text-sm text-[#275a1d]">
          {notice}
        </output>
      ) : null}
      {error ? (
        <p className="border-2 border-[#c0392b] bg-[#fff0ed] px-4 py-3 text-sm text-[#8b1f16]" role="alert">
          {error}
        </p>
      ) : null}
      <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0_#1a1a1a]">
        <div className="h-2 bg-brand-yellow" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b-2 border-[#1a1a1a] text-[10px] font-black uppercase tracking-[0.16em]">
              <tr>
                <th className="px-4 py-3">Kit</th>
                <th className="px-4 py-3">Composição</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {kits.map((kit) => (
                <KitRow
                  deleting={deletingKitId === kit.id}
                  key={kit.id}
                  kit={kit}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </tbody>
          </table>
          {kits.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#5e574c]">
              Nenhum Kit criado ainda.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function KitRow({
  kit,
  deleting,
  onDelete,
  onEdit,
}: Readonly<{
  deleting: boolean;
  kit: AdminKit;
  onDelete: (kit: AdminKit) => void;
  onEdit: (kit: AdminKit) => void;
}>) {
  const statusClassName =
    kit.status === "publish"
      ? "border-[#1a1a1a] bg-brand-yellow"
      : "border-[#1a1a1a]/30 bg-white";
  const statusLabel = kit.status === "publish" ? "Publicado" : "Rascunho";

  return (
    <tr className="border-b border-[#1a1a1a]/18 last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Image
            alt=""
            className="size-10 border border-[#1a1a1a] object-cover"
            height={40}
            src={kit.imageUrl}
            width={40}
          />
          <span className="font-bold">{kit.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        {kit.items.length} produtos · {kit.merchandise.length} brindes
      </td>
      <td className="px-4 py-3 font-bold">
        {formatBRL(parseKitMoney(kit.price))}
      </td>
      <td className="px-4 py-3">
        <span
          className={`border px-2 py-1 text-[10px] font-black uppercase tracking-widest ${statusClassName}`}
        >
          {statusLabel}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-3">
          <button
            className="relative isolate inline-flex items-center text-[10px] font-black uppercase tracking-widest"
            data-menu-underline
            data-underline-draw="true"
            disabled={deleting}
            onClick={() => onEdit(kit)}
            type="button"
          >
            Editar
            <MenuUnderline className="bottom-0.5 h-1.5 text-[#1a1a1a]" />
          </button>
          <button
            aria-label={`Excluir ${kit.name}`}
            className="grid size-8 place-items-center border-2 border-[#c0392b] text-[#8b1f16] hover:bg-[#c0392b] hover:text-white disabled:opacity-50"
            disabled={deleting}
            onClick={() => onDelete(kit)}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
