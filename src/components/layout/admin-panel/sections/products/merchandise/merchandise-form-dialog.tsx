"use client";

import { Image as ImageIcon, LoaderCircle, X } from "lucide-react";

import { useEscapeKey } from "@/hooks/use-escape-key";
import type { AdminMerchandiseKitUsage } from "@/lib/server/admin-merchandise";

import {
  MERCHANDISE_FIELD_RULES,
  merchandiseDraftErrors,
  type MerchandiseDraft,
  type MerchandiseNumericField,
} from "./merchandise-draft";
import { MerchandiseImpactDialog } from "./merchandise-impact-dialog";
import type { useMerchandiseForm } from "./use-merchandise-form";

type MerchandiseFormController = ReturnType<typeof useMerchandiseForm>;

type MerchandiseFormDialogProps = Readonly<{
  controller: MerchandiseFormController;
  usedByKits?: AdminMerchandiseKitUsage[];
}>;

const NUMERIC_FIELDS: MerchandiseNumericField[] = [
  "weight",
  "length",
  "width",
  "height",
];

/**
 * Formulário único de brinde, usado pela página de Brindes e pelo editor de Kit.
 *
 * Quantidade não está aqui de propósito: ela é do vínculo Kit ↔ brinde, e não do
 * brinde.
 */
export function MerchandiseFormDialog({
  controller,
  usedByKits = [],
}: MerchandiseFormDialogProps) {
  const { draft } = controller;

  if (!draft) return null;

  return (
    <>
      <MerchandiseFormContent
        controller={controller}
        draft={draft}
        usedByKits={usedByKits}
      />
      {controller.pendingImpact ? (
        <MerchandiseImpactDialog
          impact={controller.pendingImpact}
          merchandiseName={draft.name}
          onCancel={controller.cancelImpact}
          onConfirm={() => void controller.confirmImpact()}
          saving={controller.saving}
        />
      ) : null}
    </>
  );
}

function MerchandiseFormContent({
  controller,
  draft,
  usedByKits,
}: Readonly<{
  controller: MerchandiseFormController;
  draft: MerchandiseDraft;
  usedByKits: AdminMerchandiseKitUsage[];
}>) {
  const { close, error, patch, save, saving, showErrors, uploading, uploadImage } =
    controller;
  const errors = merchandiseDraftErrors(draft);
  const title = draft.id ? "Editar brinde" : "Criar brinde";

  useEscapeKey(close, { enabled: !saving });

  return (
    <div
      aria-labelledby="merchandise-form-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#231f20]/70 p-4 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed"
      onClick={() => !saving && close()}
      role="dialog"
    >
      <section
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[10px_10px_0_#1a1a1a]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-2 bg-brand-yellow" />
        <header className="flex items-center justify-between gap-4 border-b-2 border-[#1a1a1a] px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em]">
              Produtos · Brindes
            </p>
            <h3
              className="mt-1 text-2xl font-black uppercase"
              id="merchandise-form-title"
            >
              {title}
            </h3>
          </div>
          <button
            aria-label="Fechar formulário de brinde"
            className="grid size-10 place-items-center border-2 border-[#1a1a1a] bg-white hover:bg-brand-yellow disabled:opacity-50"
            disabled={saving}
            onClick={close}
            type="button"
          >
            <X className="size-5" />
          </button>
        </header>

        {usedByKits.length > 0 ? (
          <p className="border-b-2 border-[#1a1a1a] bg-brand-yellow px-5 py-3 text-xs font-bold leading-5 text-[#231f20]">
            Este brinde é usado em {usedByKits.length}{" "}
            {usedByKits.length === 1 ? "Kit" : "Kits"} (
            {usedByKits.map((kit) => kit.name).join(", ")}). Nome, imagem, peso e
            dimensões valem para todos eles.
          </p>
        ) : null}

        <div className="grid gap-5 p-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <MerchandiseImageField
            error={showErrors ? (errors.image ?? "") : ""}
            imageUrl={draft.imageUrl}
            onUpload={(file) => void uploadImage(file)}
            uploading={uploading}
          />
          <div className="grid content-start gap-4">
            <MerchandiseTextField
              error={showErrors ? (errors.name ?? "") : ""}
              label="Nome *"
              onChange={(name) => patch({ name })}
              placeholder="Piteira Especial"
              value={draft.name}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {NUMERIC_FIELDS.map((field) => (
                <MerchandiseNumberField
                  error={showErrors ? (errors[field] ?? "") : ""}
                  field={field}
                  key={field}
                  onChange={(value) => patch({ [field]: value })}
                  value={draft[field]}
                />
              ))}
            </div>
            <p className="text-xs leading-5 text-[#5e574c]">
              Brinde não aparece na vitrine e não tem preço nem estoque. Peso e
              dimensões existem porque entram no pacote e na cotação do frete do
              Kit.
            </p>
          </div>
        </div>

        {error ? (
          <p
            className="border-t-2 border-[#c0392b] bg-[#fff0ed] px-5 py-3 text-sm text-[#8b1f16]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <footer className="flex justify-end gap-3 border-t-2 border-[#1a1a1a] bg-white px-5 py-4">
          <button
            className="h-11 border-2 border-[#1a1a1a] px-4 text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow disabled:opacity-50"
            disabled={saving}
            onClick={close}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="h-11 border-2 border-[#1a1a1a] bg-brand-yellow px-4 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_#1a1a1a] disabled:opacity-50"
            disabled={saving || uploading}
            onClick={() => void save()}
            type="button"
          >
            {saving ? "Salvando…" : "Salvar brinde"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function MerchandiseImageField({
  error,
  imageUrl,
  onUpload,
  uploading,
}: Readonly<{
  error: string;
  imageUrl: string;
  onUpload: (file: File) => void;
  uploading: boolean;
}>) {
  return (
    <div className="grid content-start gap-1">
      <p className="text-[9px] font-black uppercase tracking-[.12em]">Imagem *</p>
      <div
        className={`aspect-square overflow-hidden border-2 bg-white ${error ? "border-[#c0392b]" : "border-[#1a1a1a]"}`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Prévia da imagem do brinde"
            className="size-full object-cover"
            src={imageUrl}
          />
        ) : (
          <div className="grid size-full place-items-center p-4 text-center text-[10px] font-black uppercase leading-4 text-[#6f6758]">
            Imagem obrigatória
          </div>
        )}
      </div>
      <label
        aria-busy={uploading}
        className="mt-1 flex h-10 cursor-pointer items-center justify-center gap-2 border-2 border-dashed border-[#1a1a1a] text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow has-disabled:cursor-not-allowed has-disabled:opacity-60"
      >
        {uploading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <ImageIcon className="size-4" />
        )}
        {uploading ? "Enviando…" : imageUrl ? "Trocar" : "Enviar"}
        <input
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (file) onUpload(file);
          }}
          type="file"
        />
      </label>
      {error ? (
        <p className="text-xs font-bold text-[#c0392b]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function MerchandiseTextField({
  error,
  label,
  onChange,
  placeholder,
  value,
}: Readonly<{
  error: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}>) {
  return (
    <label className="grid min-w-0 gap-1 text-[9px] font-black uppercase tracking-[.12em]">
      {label}
      <input
        aria-invalid={Boolean(error) || undefined}
        className={`h-11 min-w-0 border-2 bg-white px-3 text-sm font-medium normal-case tracking-normal ${error ? "border-[#c0392b]" : "border-[#1a1a1a]"}`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {error ? (
        <span className="text-xs font-bold normal-case tracking-normal text-[#c0392b]" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function MerchandiseNumberField({
  error,
  field,
  onChange,
  value,
}: Readonly<{
  error: string;
  field: MerchandiseNumericField;
  onChange: (value: string) => void;
  value: string;
}>) {
  const rule = MERCHANDISE_FIELD_RULES[field];

  return (
    <label className="grid min-w-0 gap-1 text-[9px] font-black uppercase tracking-[.12em]">
      {`${rule.label} ${rule.unit}`}
      <input
        aria-invalid={Boolean(error) || undefined}
        className={`h-11 min-w-0 border-2 bg-white px-3 text-sm font-medium normal-case tracking-normal ${error ? "border-[#c0392b]" : "border-[#1a1a1a]"}`}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {error ? (
        <span className="text-xs font-bold normal-case tracking-normal text-[#c0392b]" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
