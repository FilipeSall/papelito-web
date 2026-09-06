"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gift, Search, Trash2 } from "lucide-react";

import { MenuUnderline } from "@/components/ui/menu-underline";
import type { AdminMerchandise } from "@/lib/server/admin-merchandise";

import { productsHref } from "../products-config";
import {
  formatMerchandiseDimensions,
  formatMerchandiseWeight,
} from "./merchandise-draft";

type MerchandiseListProps = Readonly<{
  deletingId: number | null;
  error: string;
  merchandise: AdminMerchandise[];
  notice: string;
  onCreate: () => void;
  onDelete: (merchandise: AdminMerchandise) => void;
  onEdit: (merchandise: AdminMerchandise) => void;
  onSearchChange: (search: string) => void;
  search: string;
  total: number;
}>;

export function MerchandiseList({
  deletingId,
  error,
  merchandise,
  notice,
  onCreate,
  onDelete,
  onEdit,
  onSearchChange,
  search,
  total,
}: MerchandiseListProps) {
  return (
    <div className="space-y-5 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#6f6758]">
            <span>Papelito</span>
            <span aria-hidden>/</span>
            <span>Admin</span>
            <span aria-hidden>/</span>
            <span className="font-semibold text-[#231f20]">Brindes</span>
          </div>
          <h2
            className="mt-3 text-[2.35rem] font-semibold leading-none tracking-[-0.04em] text-[#231f20]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Brindes
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5e574c]">
            Catálogo reutilizável: o mesmo brinde entra em quantos Kits você
            quiser, e peso e dimensões vêm daqui para a cotação de frete.
          </p>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-brand-yellow px-4 text-[11px] font-black uppercase tracking-[0.14em] shadow-[4px_4px_0_#1a1a1a] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
          onClick={onCreate}
          type="button"
        >
          <Gift className="size-4" />
          Criar brinde
        </button>
      </header>

      {notice ? (
        <output className="block border-2 border-[#275a1d] bg-[#eff8e9] px-4 py-3 text-sm text-[#275a1d]">
          {notice}
        </output>
      ) : null}
      {error ? (
        <p
          className="border-2 border-[#c0392b] bg-[#fff0ed] px-4 py-3 text-sm text-[#8b1f16]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <label className="flex h-11 max-w-md items-center gap-2 border-2 border-[#1a1a1a] bg-white px-3">
        <Search className="size-4" />
        <input
          className="min-w-0 flex-1 outline-none"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar brinde por nome"
          value={search}
        />
      </label>

      <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0_#1a1a1a]">
        <div className="h-2 bg-brand-yellow" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b-2 border-[#1a1a1a] text-[10px] font-black uppercase tracking-[0.16em]">
              <tr>
                <th className="px-4 py-3">Brinde</th>
                <th className="px-4 py-3">Peso</th>
                <th className="px-4 py-3">Dimensões</th>
                <th className="px-4 py-3">Uso</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {merchandise.map((item) => (
                <MerchandiseRow
                  deleting={deletingId === item.id}
                  key={item.id}
                  merchandise={item}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </tbody>
          </table>
          {merchandise.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#5e574c]">
              {total === 0
                ? "Nenhum brinde cadastrado ainda. Crie um aqui ou direto no editor de Kit."
                : "Nenhum brinde corresponde à busca."}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MerchandiseRow({
  deleting,
  merchandise,
  onDelete,
  onEdit,
}: Readonly<{
  deleting: boolean;
  merchandise: AdminMerchandise;
  onDelete: (merchandise: AdminMerchandise) => void;
  onEdit: (merchandise: AdminMerchandise) => void;
}>) {
  const [showKits, setShowKits] = useState(false);
  const isUsed = merchandise.kitCount > 0;

  return (
    <>
      <tr className="border-b border-[#1a1a1a]/18 last:border-0">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Image
              alt=""
              className="size-10 border border-[#1a1a1a] object-cover"
              height={40}
              src={merchandise.imageUrl}
              width={40}
            />
            <span className="font-bold">{merchandise.name}</span>
          </div>
        </td>
        <td className="px-4 py-3">{formatMerchandiseWeight(merchandise.weight)}</td>
        <td className="px-4 py-3">{formatMerchandiseDimensions(merchandise)}</td>
        <td className="px-4 py-3">
          {isUsed ? (
            <button
              aria-expanded={showKits}
              className="relative isolate inline-flex items-center text-[11px] font-black uppercase tracking-widest"
              data-menu-underline
              data-underline-draw="true"
              onClick={() => setShowKits((current) => !current)}
              type="button"
            >
              {`Usado em ${merchandise.kitCount} ${merchandise.kitCount === 1 ? "kit" : "kits"}`}
              <MenuUnderline className="bottom-0.5 h-1.5 text-[#1a1a1a]" />
            </button>
          ) : (
            <span className="border border-[#1a1a1a]/30 bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#6f6758]">
              Não utilizado
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-3">
            <button
              className="relative isolate inline-flex items-center text-[10px] font-black uppercase tracking-widest"
              data-menu-underline
              data-underline-draw="true"
              disabled={deleting}
              onClick={() => onEdit(merchandise)}
              type="button"
            >
              Editar
              <MenuUnderline className="bottom-0.5 h-1.5 text-[#1a1a1a]" />
            </button>
            <button
              aria-label={`Excluir ${merchandise.name}`}
              className="grid size-8 place-items-center border-2 border-[#c0392b] text-[#8b1f16] hover:bg-[#c0392b] hover:text-white disabled:opacity-40"
              disabled={deleting || isUsed}
              onClick={() => onDelete(merchandise)}
              title={
                isUsed
                  ? "Brinde em uso não pode ser excluído"
                  : `Excluir ${merchandise.name}`
              }
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </td>
      </tr>
      {showKits && isUsed ? (
        <tr className="border-b border-[#1a1a1a]/18 bg-white last:border-0">
          <td className="px-4 py-3" colSpan={5}>
            <ul className="flex flex-wrap gap-2">
              {merchandise.kits.map((kit) => (
                <li key={kit.kitId}>
                  <Link
                    className="inline-flex items-center gap-2 border-2 border-[#1a1a1a] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow"
                    href={`${productsHref("kits")}&focus=${kit.kitId}`}
                  >
                    {kit.name}
                    <span className="font-medium normal-case tracking-normal text-[#5e574c]">
                      {`${kit.quantity}×`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}
