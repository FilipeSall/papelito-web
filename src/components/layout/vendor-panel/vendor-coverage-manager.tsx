"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Panel } from "@/components/layout/operational-panel";
import { VendorCoverageRangesField } from "@/components/shared/vendor-coverage-ranges-field";
import {
  type CoverageRangeValue,
  normalizeCoverageRanges,
  validateCoverageRanges,
} from "@/features/vendor-coverage/coverage-presets";
import type {
  VendorCoverageRange,
  VendorCoverageSnapshot,
} from "@/features/vendor-coverage/types/vendor-coverage";
import { normalizeCep } from "@/features/revendedor/utils/revendedor-formatters";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";

type ApiCoverageResponse = {
  items?: Array<{
    id?: number;
    max_cep?: string;
    max_cep_formatted?: string;
    min_cep?: string;
    min_cep_formatted?: string;
  }>;
  message?: string;
};

function mapApiRanges(data: ApiCoverageResponse | null): VendorCoverageRange[] | null {
  if (!Array.isArray(data?.items)) {
    return null;
  }

  return data.items
    .map((item) => ({
      id: Number(item.id) || 0,
      maxCep: item.max_cep ?? "",
      maxCepFormatted: item.max_cep_formatted ?? item.max_cep ?? "",
      minCep: item.min_cep ?? "",
      minCepFormatted: item.min_cep_formatted ?? item.min_cep ?? "",
    }))
    .filter((item) => item.id > 0);
}

function rangeOverlaps(
  items: VendorCoverageRange[],
  draftRanges: CoverageRangeValue[],
  editingId: number | null,
) {
  return normalizeCoverageRanges(draftRanges).some((draftRange) => {
    const minCep = Number(normalizeCep(draftRange.minCep));
    const maxCep = Number(normalizeCep(draftRange.maxCep));

    return items.some((item) => {
      if (editingId && item.id === editingId) {
        return false;
      }

      return minCep <= Number(item.maxCep) && maxCep >= Number(item.minCep);
    });
  });
}

export function VendorCoverageManager({ snapshot }: { snapshot: VendorCoverageSnapshot }) {
  const router = useRouter();
  const [items, setItems] = useState(snapshot.items);
  const [draftRanges, setDraftRanges] = useState<CoverageRangeValue[]>([{ maxCep: "", minCep: "" }]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const editingRange = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [editingId, items],
  );
  const normalizedDraftRanges = normalizeCoverageRanges(draftRanges).filter(
    (range) => range.minCep || range.maxCep,
  );
  const draftError =
    editingRange && normalizedDraftRanges.length > 1
      ? "Para aplicar uma regiao com mais de uma faixa, remova esta faixa e crie uma nova cobertura."
      : validateCoverageRanges(draftRanges, { requireAtLeastOne: true });

  function beginEdit(item: VendorCoverageRange) {
    setEditingId(item.id);
    setDraftRanges([{ maxCep: item.maxCepFormatted, minCep: item.minCepFormatted }]);
    setFeedback(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftRanges([{ maxCep: "", minCep: "" }]);
  }

  async function persistRange() {
    if (draftError) {
      setFeedback({ error: true, message: draftError });
      return;
    }

    if (rangeOverlaps(items, draftRanges, editingId)) {
      setFeedback({ error: true, message: "Esta faixa se sobrepoe a uma faixa já cadastrada." });
      return;
    }

    setPendingAction(editingId ? `edit:${editingId}` : "create");
    try {
      const nextItems = await persistDraftRanges({
        draftRanges: normalizedDraftRanges,
        editingId,
      });

      if (!nextItems) {
        throw new Error("Não foi possível salvar a faixa.");
      }

      setItems(nextItems);
      setFeedback({ error: false, message: editingId ? "Faixa atualizada." : "Faixa adicionada." });
      cancelEdit();
      router.refresh();
    } catch (error) {
      setFeedback({
        error: true,
        message: error instanceof Error ? error.message : "Não foi possível salvar a faixa.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function persistDraftRanges({
    draftRanges: rangesToPersist,
    editingId: currentEditingId,
  }: {
    draftRanges: CoverageRangeValue[];
    editingId: number | null;
  }) {
    if (currentEditingId) {
      const response = await fetch(`/api/vendor/coverage-ranges/${currentEditingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxCep: normalizeCep(rangesToPersist[0]?.maxCep ?? ""),
          minCep: normalizeCep(rangesToPersist[0]?.minCep ?? ""),
        }),
      });
      const data = (await response.json().catch(() => null)) as ApiCoverageResponse | null;
      const nextItems = mapApiRanges(data);

      if (!response.ok || !nextItems) {
        throw new Error(data?.message ?? "Não foi possível salvar a faixa.");
      }

      return nextItems;
    }

    let nextItems: VendorCoverageRange[] | null = null;

    for (const range of rangesToPersist) {
      const response = await fetch("/api/vendor/coverage-ranges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxCep: normalizeCep(range.maxCep),
          minCep: normalizeCep(range.minCep),
        }),
      });
      const data = (await response.json().catch(() => null)) as ApiCoverageResponse | null;
      const mappedItems = mapApiRanges(data);

      if (!response.ok || !mappedItems) {
        throw new Error(data?.message ?? "Não foi possível salvar a faixa.");
      }

      nextItems = mappedItems;
    }

    return nextItems;
  }

  async function removeRange(item: VendorCoverageRange) {
    const confirmed = window.confirm(`Remover a faixa ${item.minCepFormatted} a ${item.maxCepFormatted}?`);

    if (!confirmed) {
      return;
    }

    setPendingAction(`delete:${item.id}`);
    try {
      const response = await fetch(`/api/vendor/coverage-ranges/${item.id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as ApiCoverageResponse | null;
      const nextItems = mapApiRanges(data);

      if (!response.ok || !nextItems) {
        throw new Error(data?.message ?? "Não foi possível remover a faixa.");
      }

      setItems(nextItems);
      setFeedback({ error: false, message: "Faixa removida." });
      if (editingId === item.id) {
        cancelEdit();
      }
      router.refresh();
    } catch (error) {
      setFeedback({
        error: true,
        message: error instanceof Error ? error.message : "Não foi possível remover a faixa.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-dark/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-dark/48">
              Faixas cadastradas
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-dark">
              {items.length === 1 ? "1 faixa ativa" : `${items.length} faixas ativas`}
            </p>
          </div>
        </div>
        <FeedbackBanner className="mx-5 mt-4" feedback={feedback} />
        {items.length === 0 ? (
          <p className="px-5 py-10 text-sm text-brand-dark/64">
            Nenhuma faixa cadastrada. Adicione uma faixa para habilitar cobertura regional.
          </p>
        ) : (
          <div className="overflow-x-auto px-2 pt-3">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  {["CEP inicial", "CEP final", "Status", "Ações"].map((header) => (
                    <th
                      className="border-b border-brand-dark/12 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48 last:text-right"
                      key={header}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="align-middle" key={item.id}>
                    <td className="border-b border-brand-dark/8 px-4 py-4 text-sm font-black text-brand-dark">
                      {item.minCepFormatted}
                    </td>
                    <td className="border-b border-brand-dark/8 px-4 py-4 text-sm font-black text-brand-dark">
                      {item.maxCepFormatted}
                    </td>
                    <td className="border-b border-brand-dark/8 px-4 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                        Ativa
                      </span>
                    </td>
                    <td className="border-b border-brand-dark/8 px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-brand-dark/12 text-brand-dark transition hover:bg-brand-dark hover:text-brand-yellow disabled:opacity-40"
                          disabled={pendingAction !== null}
                          onClick={() => beginEdit(item)}
                          title="Editar faixa"
                          type="button"
                        >
                          <Pencil aria-hidden className="h-4 w-4" />
                        </button>
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-rose-200 text-rose-700 transition hover:bg-rose-700 hover:text-white disabled:opacity-40"
                          disabled={pendingAction !== null}
                          onClick={() => void removeRange(item)}
                          title="Remover faixa"
                          type="button"
                        >
                          <Trash2 aria-hidden className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="h-fit overflow-hidden">
        <div className="bg-brand-dark px-5 py-3 text-brand-yellow">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em]">
            {editingRange ? "Editar faixa" : "Nova faixa"}
          </p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <VendorCoverageRangesField
            mode="single"
            onChangeRanges={setDraftRanges}
            ranges={draftRanges}
            required
            variant="vendor-panel"
          />
          {draftError && normalizedDraftRanges.length > 0 ? (
            <p className="rounded-[10px] bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {draftError}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[12px] bg-brand-yellow px-4 text-xs font-black uppercase tracking-[0.16em] text-brand-dark shadow-[4px_4px_0_rgba(35,31,32,0.14)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              disabled={pendingAction !== null || Boolean(draftError)}
              onClick={() => void persistRange()}
              type="button"
            >
              {editingRange ? <Check aria-hidden className="h-4 w-4" /> : <Plus aria-hidden className="h-4 w-4" />}
              {pendingAction === "create" || pendingAction === `edit:${editingId}`
                ? "Salvando"
                : editingRange
                  ? "Salvar"
                  : "Adicionar"}
            </button>
            {editingRange ? (
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-brand-dark/12 px-4 text-xs font-black uppercase tracking-[0.16em] text-brand-dark transition hover:bg-brand-dark hover:text-brand-yellow"
                disabled={pendingAction !== null}
                onClick={cancelEdit}
                type="button"
              >
                <X aria-hidden className="h-4 w-4" />
                Cancelar
              </button>
            ) : null}
          </div>
        </div>
      </Panel>
    </div>
  );
}
