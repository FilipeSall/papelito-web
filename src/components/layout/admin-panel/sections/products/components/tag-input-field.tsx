"use client";

import type { KeyboardEvent } from "react";

import { TAG_PLACEHOLDER_EXAMPLES } from "@/constants/admin-products";
import type { AdminProductTaxonomyTerm } from "@/lib/server/admin-products";

type TagInputFieldProps = {
  isCreating: boolean;
  newTagName: string;
  onCreateTag: (name: string) => void;
  onNewTagNameChange: (value: string) => void;
  onRemoveTag: (id: string) => void;
  selectedIds: string[];
  tags: AdminProductTaxonomyTerm[];
};

export function TagInputField({
  isCreating,
  newTagName,
  onCreateTag,
  onNewTagNameChange,
  onRemoveTag,
  selectedIds,
  tags,
}: TagInputFieldProps) {
  const selectedTags = tags.filter((tag) => selectedIds.includes(String(tag.id)));

  function commit() {
    const trimmed = newTagName.trim().replace(/,$/, "").trim();
    if (trimmed) {
      onCreateTag(trimmed);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    }
  }

  return (
    <div className="space-y-2">
      <div className="rounded-[4px] border border-[#c9bd96] bg-white p-2 transition focus-within:border-[#231f20]">
        {selectedTags.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span
                className="inline-flex items-center gap-2 rounded-[4px] border border-[#c9bd96] bg-[#e9dfc7] px-3 py-1.5 text-sm font-medium text-[#231f20]"
                key={tag.id}
              >
                {tag.name}
                <button
                  aria-label={`Remover tag ${tag.name}`}
                  className="cursor-pointer text-lg leading-none text-[#231f20]/78 transition hover:text-[#8b3f2d]"
                  onClick={() => onRemoveTag(String(tag.id))}
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <input
            className="min-h-9 min-w-0 flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-[#231f20]/35 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCreating}
            onBlur={commit}
            onChange={(event) => onNewTagNameChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isCreating ? "Criando tag..." : TAG_PLACEHOLDER_EXAMPLES}
            value={newTagName}
          />
          {isCreating ? (
            <span
              className="inline-flex items-center gap-1.5 pr-1 text-xs text-[#231f20]/52"
              role="status"
            >
              <span
                aria-hidden
                className="h-3 w-3 animate-spin rounded-full border border-[#231f20]/18 border-t-[#231f20]/60"
              />
              Criando tag
            </span>
          ) : null}
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-[#231f20]/48">
        Pressione Enter ou vírgula para adicionar.
      </p>
    </div>
  );
}
