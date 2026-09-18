"use client";

import { ArrowLeft, Check, Ruler } from "lucide-react";

import { FOCUS_RING, PrimaryButton } from "@/components/layout/admin-panel/primitives";
import { ProfileFormField } from "@/components/layout/profile-page";
import type {
  VendorPackagingCatalogItem,
  VendorPackagingDraft,
  VendorPackagingProfile,
} from "@/features/vendor-packaging/types/vendor-packaging";

import { PackagingBoxGlyph } from "./packaging-glyphs";

type DraftField = keyof VendorPackagingDraft;

function formatCm(valueMm: number): string {
  return String(valueMm / 10).replace(".", ",");
}

function parseCm(value: string): number {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 10 : 0;
}

function catalogLine(model: VendorPackagingCatalogItem): string {
  return `Catálogo RPC: ${formatCm(model.lengthMm)} × ${formatCm(model.widthMm)} × ${formatCm(model.heightMm)} cm`;
}

function headline(editing: VendorPackagingProfile | null, model: VendorPackagingCatalogItem | null): string {
  if (editing) return `Conferir ${editing.code}`;
  if (model) return `Cadastrar ${model.code}`;
  return "Cadastrar caixa própria";
}

function helper(editing: VendorPackagingProfile | null, model: VendorPackagingCatalogItem | null): string {
  if (editing) {
    return "Salvar gera uma nova versão do perfil. Os pedidos já despachados guardam a versão que usaram.";
  }
  if (model) {
    return "As medidas vêm do catálogo RPC. Confira com uma caixa na mão antes de salvar: é a medida interna que o cálculo de frete usa.";
  }
  return "Meça a caixa por dentro, vazia. A tara é o peso dela sozinha e entra no peso bruto que vai para a transportadora.";
}

const DIMENSION_FIELDS: { field: DraftField; label: string }[] = [
  { field: "lengthCm", label: "Comprimento (cm)" },
  { field: "widthCm", label: "Largura (cm)" },
  { field: "heightCm", label: "Altura (cm)" },
];

/**
 * Bancada de conferência: o formulário que recebe o modelo escolhido na grade.
 *
 * Ele não é uma coluna permanente — abre no lugar da grade quando há uma caixa em mãos e sai
 * quando termina. A silhueta é desenhada com o que está digitado, não com o que está salvo, então
 * um erro de vírgula aparece como uma caixa de formato errado antes de virar frete errado — e por
 * isso ela vem antes das ações em qualquer largura, nunca depois do botão de salvar.
 */
export function PackagingEditor({
  draft,
  editing,
  fieldErrors,
  model,
  onCancel,
  onChange,
  onSubmit,
  pending,
}: Readonly<{
  draft: VendorPackagingDraft;
  editing: VendorPackagingProfile | null;
  fieldErrors: Partial<Record<DraftField, string>>;
  model: VendorPackagingCatalogItem | null;
  onCancel: () => void;
  onChange: (field: DraftField, value: string) => void;
  onSubmit: () => void;
  pending: boolean;
}>) {
  const previewLength = parseCm(draft.lengthCm);
  const previewWidth = parseCm(draft.widthCm);
  const previewHeight = parseCm(draft.heightCm);
  const hasPreview = previewLength > 0 && previewWidth > 0 && previewHeight > 0;

  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a1a1a] px-5 py-3 md:px-6">
        <button
          className={[
            "inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.18em] text-[#1a1a1a] uppercase",
            FOCUS_RING,
          ].join(" ")}
          onClick={onCancel}
          type="button"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
          Voltar aos modelos
        </button>
        {model ? (
          <p className="font-mono text-[11px] font-bold text-[#4a5565]" data-numeric>
            {catalogLine(model)}
          </p>
        ) : null}
      </header>

      <form
        className="grid gap-6 px-5 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_200px]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="space-y-5 lg:order-1">
          <div>
            <h3 className="text-xl font-black tracking-[0.04em] text-[#1a1a1a] uppercase">
              {headline(editing, model)}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#4a5565]">
              {helper(editing, model)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileFormField
              errorMessage={fieldErrors.label}
              label="Nome da caixa"
              onChange={(value) => onChange("label", value)}
              placeholder="Ex: Caixa média do depósito"
              value={draft.label}
            />
            <ProfileFormField
              errorMessage={fieldErrors.code}
              inputClassName="font-mono uppercase"
              label="Código"
              maxLength={32}
              onChange={(value) => onChange("code", value)}
              placeholder="Ex: M12"
              value={draft.code}
            />
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.18em] text-[#1a1a1a] uppercase">
              <Ruler aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
              Medidas internas
            </p>
            <div className="mt-3 grid items-end gap-4 sm:grid-cols-3">
              {DIMENSION_FIELDS.map((dimension) => (
                <ProfileFormField
                  errorMessage={fieldErrors[dimension.field]}
                  inputMode="decimal"
                  key={dimension.field}
                  label={dimension.label}
                  onChange={(value) => onChange(dimension.field, value)}
                  value={draft[dimension.field]}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileFormField
              errorMessage={fieldErrors.tareKg}
              inputMode="decimal"
              label="Tara (kg) — opcional"
              onChange={(value) => onChange("tareKg", value)}
              placeholder="Pese depois se não souber"
              value={draft.tareKg}
            />
            <ProfileFormField
              errorMessage={fieldErrors.maxPayloadKg}
              inputMode="decimal"
              label="Carga máxima (kg)"
              onChange={(value) => onChange("maxPayloadKg", value)}
              placeholder="Deixe vazio se não houver"
              value={draft.maxPayloadKg}
            />
          </div>

          <p className="text-xs leading-5 text-[#4a5565]">
            A tara é o peso da caixa vazia, e ela é cobrada: a transportadora recebe o peso dos
            produtos mais o dela. O catálogo dos Correios não publica esse número — só as medidas e
            a resistência —, então ele precisa vir da sua balança. Pode salvar sem ele e pesar
            depois; enquanto faltar, a caixa fica marcada como tara pendente.
          </p>

        </div>

        <aside className="lg:order-2">
          <div className="border-2 border-[#1a1a1a] bg-white p-4">
            <p className="text-[10px] font-black tracking-[0.18em] text-[#4a5565] uppercase">
              Proporção
            </p>
            {hasPreview ? (
              <PackagingBoxGlyph
                className="mt-3 h-28 w-full text-[#1a1a1a] lg:h-36"
                heightMm={previewHeight}
                lengthMm={previewLength}
                widthMm={previewWidth}
              />
            ) : (
              <p className="mt-3 text-xs leading-5 text-[#4a5565]">
                Preencha as três medidas para ver o formato da caixa.
              </p>
            )}
          </div>
        </aside>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:order-3 lg:col-span-2">
          <PrimaryButton disabled={pending} type="submit">
            <Check aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            {pending ? "Salvando..." : "Salvar caixa"}
          </PrimaryButton>
          <button
            className={[
              "inline-flex h-11 items-center justify-center border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black tracking-[0.18em] text-[#1a1a1a] uppercase transition hover:bg-[#1a1a1a] hover:text-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
              FOCUS_RING,
            ].join(" ")}
            disabled={pending}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
