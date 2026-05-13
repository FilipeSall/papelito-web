"use client";

import type { AdminProductTaxonomyTerm } from "@/lib/server/admin-products";

import { formatTermLabel } from "../helpers";

type TermChecklistProps = {
  label: string;
  onToggle: (id: string) => void;
  selectedIds: string[];
  terms: AdminProductTaxonomyTerm[];
};

export function TermChecklist({
  label,
  onToggle,
  selectedIds,
  terms,
}: TermChecklistProps) {
  return (
    <div className="grid gap-2">
      <span className="sr-only">{label}</span>
      <div className="max-h-52 space-y-2 overflow-auto">
        {terms.length === 0 ? (
          <p className="px-2 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#231f20]/42">
            sem opcoes
          </p>
        ) : (
          terms.map((term) => {
            const termId = String(term.id);
            return (
              <label
                className="flex cursor-pointer items-center gap-3 text-base leading-5 text-[#231f20] transition hover:text-[#8b3f2d]"
                key={term.id}
              >
                <input
                  checked={selectedIds.includes(termId)}
                  className="h-5 w-5 accent-[#ffe500]"
                  onChange={() => onToggle(termId)}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1 truncate">
                  {formatTermLabel(term, terms)}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
