"use client";

import { useState } from "react";
import { X } from "lucide-react";

import type { AdminCategory } from "@/lib/server/admin-taxonomy";

export type CategoryFormValues = {
  description: string;
  name: string;
  seoDescription: string;
  seoTitle: string;
  slug?: string;
};

export function CategoryEditorModal({
  category,
  isSaving,
  onClose,
  onSave,
}: {
  category: AdminCategory | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: CategoryFormValues) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [seoTitle, setSeoTitle] = useState(category?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(category?.seoDescription ?? "");
  const [error, setError] = useState("");

  /**
   * Slug editável só enquanto a categoria não tem produto: depois disso ele é
   * referência de URL pública e de qualquer integração que já apontou para ela.
   */
  const isSlugLocked = Boolean(category && category.productCount.total > 0);

  function handleSubmit() {
    if (!name.trim()) {
      setError("Informe o nome da categoria.");
      return;
    }

    setError("");
    onSave({
      description,
      name: name.trim(),
      seoDescription,
      seoTitle,
      ...(isSlugLocked ? {} : { slug: slug.trim() || name.trim() }),
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#231f20]/70 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-auto border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div className="h-2 w-full bg-brand-yellow" />
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#1a1a1a] p-5">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
            {category ? "Editar categoria" : "Nova categoria"}
          </h3>
          <button
            aria-label="Fechar"
            className="cursor-pointer border-2 border-[#1a1a1a] bg-white p-1.5 text-[#1a1a1a] transition hover:bg-brand-yellow"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <Field label="Nome *" onChange={setName} value={name} />
          <Field
            disabled={isSlugLocked}
            helpText={
              isSlugLocked
                ? "Bloqueado: a categoria já tem produtos e o slug é referência pública."
                : undefined
            }
            label="Slug"
            onChange={setSlug}
            value={slug}
          />
          <Field label="Descrição" onChange={setDescription} value={description} />
          <Field label="Título de SEO" onChange={setSeoTitle} value={seoTitle} />
          <Field
            label="Descrição de SEO"
            onChange={setSeoDescription}
            value={seoDescription}
          />

          {error ? (
            <p className="text-sm font-semibold text-[#c0392b]">⚠ {error}</p>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t-2 border-[#1a1a1a] p-5">
          <button
            className="cursor-pointer border-2 border-[#1a1a1a] bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="cursor-pointer border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffe500] shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={handleSubmit}
            type="button"
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  disabled = false,
  helpText,
  label,
  onChange,
  value,
}: {
  disabled?: boolean;
  helpText?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
        {label}
      </span>
      <input
        className="h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none transition focus:outline-2 focus:outline-brand-yellow disabled:bg-[#efeade] disabled:text-[#231f20]/50"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        type="text"
        value={value}
      />
      {helpText ? (
        <span className="text-[11px] font-semibold text-[#231f20]/60">{helpText}</span>
      ) : null}
    </label>
  );
}
