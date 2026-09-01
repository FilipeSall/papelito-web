"use client";

import { useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { FieldLabel } from "@/components/layout/admin-panel/sections/products/components/form-fields";
import { LongDescriptionEditor } from "@/components/layout/admin-panel/sections/products/components/long-description-editor";
import type { AdminFlashSaleCandidate } from "@/lib/server/admin-flash-sale";
import type { AdminKitMerchandise } from "@/lib/server/admin-kits";
import { formatBRL } from "@/lib/format-currency";

import { AdminSelectField } from "./components/admin-select-field";
import {
  KIT_PACKAGE_DIMENSION_RULES,
  kitDimensionError,
  kitDimensionRange,
  parseKitMoney,
} from "./kits-manager-draft";
import type { KitDraft, UploadTarget } from "./kits-manager-types";

const statusOptions = [
  { label: "Rascunho", value: "draft" },
  { label: "Publicado", value: "publish" },
] as const;

type KitEditorDialogProps = Readonly<{
  draft: KitDraft | null;
  error: string;
  filteredProducts: AdminFlashSaleCandidate[];
  initialProducts: AdminFlashSaleCandidate[];
  onAddMerchandise: () => void;
  onAddProduct: (product: AdminFlashSaleCandidate) => void;
  onPatchDraft: (patch: Partial<KitDraft>) => void;
  onPatchMerchandise: (
    clientId: string,
    patch: Partial<AdminKitMerchandise>,
  ) => void;
  onRemoveMerchandise: (clientId: string) => void;
  onRemoveProduct: (productId: number) => void;
  onRequestClose: () => void;
  onSave: () => Promise<void>;
  onSearchChange: (search: string) => void;
  onSetProductQuantity: (productId: number, quantity: number) => void;
  onUploadImage: (file: File, target: UploadTarget) => Promise<void>;
  referenceCents: number;
  saving: boolean;
  saveDisabled: boolean;
  search: string;
  selectedProductIds: Set<number>;
  uploadingTargets: UploadTarget[];
  uploadNotice: string;
}>;

export function KitEditorDialog(props: KitEditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { draft, saving } = props;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (draft) {
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      }
      return;
    }

    if (dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [draft]);

  function handleCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    if (saving) event.preventDefault();
  }

  function handleClose() {
    if (draft && !saving) props.onRequestClose();
  }

  return (
    <dialog
      className="m-auto max-h-[calc(100vh-1.5rem)] w-[calc(100%-1.5rem)] max-w-6xl overflow-hidden border-2 border-[#1a1a1a] bg-[#faf8f2] p-0 shadow-[12px_12px_0_#1a1a1a] backdrop:bg-[#231f20]/70 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed"
      onCancel={handleCancel}
      onClose={handleClose}
      ref={dialogRef}
    >
      {draft ? <KitEditorContent {...props} draft={draft} /> : null}
    </dialog>
  );
}

function KitEditorContent({
  draft,
  error,
  filteredProducts,
  initialProducts,
  onAddMerchandise,
  onAddProduct,
  onPatchDraft,
  onPatchMerchandise,
  onRemoveMerchandise,
  onRemoveProduct,
  onRequestClose,
  onSave,
  onSearchChange,
  onSetProductQuantity,
  onUploadImage,
  referenceCents,
  saving,
  saveDisabled,
  search,
  selectedProductIds,
  uploadingTargets,
  uploadNotice,
}: KitEditorDialogProps & { draft: KitDraft }) {
  const title = draft.id ? "Editar Kit" : "Criar Kit";
  const kitUploadText = uploadButtonText(
    uploadingTargets.includes("kit"),
    draft.imageUrl,
    "imagem",
  );

  return (
    <div className="flex max-h-[calc(100vh-1.5rem)] flex-col">
      <div className="h-2 bg-brand-yellow" />
      <header className="flex items-center justify-between border-b-2 border-[#1a1a1a] px-5 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em]">
            Produtos · Kits
          </p>
          <h3 className="mt-1 text-2xl font-black uppercase">{title}</h3>
        </div>
        <button
          aria-label="Fechar editor de Kit"
          className="grid size-10 place-items-center border-2 border-[#1a1a1a] bg-white hover:bg-brand-yellow"
          disabled={saving}
          onClick={onRequestClose}
          type="button"
        >
          <X className="size-5" />
        </button>
      </header>
      <div className="grid flex-1 gap-6 overflow-y-auto p-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <KitSection title="Identificação">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Nome do Kit *"
                onChange={(name) => onPatchDraft({ name })}
                value={draft.name}
              />
              <TextField
                label="Slug"
                onChange={(slug) => onPatchDraft({ slug })}
                value={draft.slug ?? ""}
              />
              <AdminSelectField
                label="Status"
                onChange={(status) =>
                  onPatchDraft({ status: status as KitDraft["status"] })
                }
                options={statusOptions}
                placeholder="Selecione o status"
                value={draft.status}
                variant="vendor-create"
              />
            </div>
          </KitSection>
          <KitProductsSection
            draft={draft}
            filteredProducts={filteredProducts}
            initialProducts={initialProducts}
            onAddProduct={onAddProduct}
            onRemoveProduct={onRemoveProduct}
            onSearchChange={onSearchChange}
            onSetProductQuantity={onSetProductQuantity}
            search={search}
            selectedProductIds={selectedProductIds}
          />
          <KitPackageSection draft={draft} onPatchDraft={onPatchDraft} />
          <KitDescriptionsSection draft={draft} onPatchDraft={onPatchDraft} />
          <KitMerchandiseSection
            draft={draft}
            onAddMerchandise={onAddMerchandise}
            onPatchMerchandise={onPatchMerchandise}
            onRemoveMerchandise={onRemoveMerchandise}
            onUploadImage={onUploadImage}
            saving={saving}
            uploadingTargets={uploadingTargets}
          />
        </div>
        <aside className="space-y-6">
          <KitImageSection
            draft={draft}
            isUploading={uploadingTargets.includes("kit")}
            onUploadImage={onUploadImage}
            uploadText={kitUploadText}
          />
          <KitPriceSection
            draft={draft}
            onPatchDraft={onPatchDraft}
            referenceCents={referenceCents}
          />
          <KitSummary draft={draft} />
        </aside>
      </div>
      {uploadNotice ? (
        <p
          aria-live="polite"
          className="border-t-2 border-[#1a1a1a] bg-[#eff8e9] px-5 py-3 text-sm text-[#275a1d]"
          role="status"
        >
          {uploadNotice}
        </p>
      ) : null}
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
          className="h-11 border-2 border-[#1a1a1a] px-4 text-[10px] font-black uppercase tracking-widest"
          disabled={saving}
          onClick={onRequestClose}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="h-11 border-2 border-[#1a1a1a] bg-brand-yellow px-4 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_#1a1a1a] disabled:opacity-50"
          disabled={saveDisabled}
          onClick={onSave}
          type="button"
        >
          {saving ? "Salvando…" : "Salvar Kit"}
        </button>
      </footer>
    </div>
  );
}

function KitProductsSection({
  draft,
  filteredProducts,
  initialProducts,
  onAddProduct,
  onRemoveProduct,
  onSearchChange,
  onSetProductQuantity,
  search,
  selectedProductIds,
}: Readonly<
  Pick<
    KitEditorDialogProps,
    | "draft"
    | "filteredProducts"
    | "initialProducts"
    | "onAddProduct"
    | "onRemoveProduct"
    | "onSearchChange"
    | "onSetProductQuantity"
    | "search"
    | "selectedProductIds"
  >
>) {
  if (!draft) return null;
  return (
    <KitSection title="Produtos do Kit">
      <label className="flex h-10 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-3">
        <Search className="size-4" />
        <input
          className="min-w-0 flex-1 outline-none"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nome ou SKU"
          value={search}
        />
      </label>
      <div className="mt-3 max-h-48 overflow-y-auto border-2 border-[#1a1a1a] bg-white">
        {filteredProducts.map((product) => {
          const isSelected = selectedProductIds.has(product.id);
          const actionLabel = isSelected ? "Adicionado" : "Adicionar";
          return (
            <div
              className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/15 p-3 last:border-0"
              key={product.id}
            >
              <span>
                <b>{product.name}</b>
                <small className="ml-2 text-[#5e574c]">
                  {product.sku || "Sem SKU"}
                </small>
              </span>
              <button
                className="border-2 border-[#1a1a1a] bg-brand-yellow px-2 py-1 text-[10px] font-black uppercase disabled:opacity-40"
                disabled={isSelected}
                onClick={() => onAddProduct(product)}
                type="button"
              >
                {actionLabel}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-3 space-y-2">
        {draft.items.map((item) => {
          const product = initialProducts.find(
            (candidate) => candidate.id === item.productId,
          );
          const productName = product?.name ?? `Produto #${item.productId}`;
          return (
            <div
              className="flex items-center gap-3 border-2 border-[#1a1a1a] bg-white p-3"
              key={item.productId}
            >
              <span className="min-w-0 flex-1 truncate font-bold">
                {productName}
              </span>
              <input
                aria-label={`Quantidade de ${productName}`}
                className="h-9 w-16 border-2 border-[#1a1a1a] px-2"
                min="1"
                onChange={(event) =>
                  onSetProductQuantity(
                    item.productId,
                    Number(event.target.value),
                  )
                }
                type="number"
                value={item.quantity}
              />
              <button
                aria-label={`Remover ${productName}`}
                className="grid size-9 place-items-center border-2 border-[#1a1a1a] bg-white hover:bg-[#c0392b] hover:text-white"
                onClick={() => onRemoveProduct(item.productId)}
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </KitSection>
  );
}

function KitPackageSection({
  draft,
  onPatchDraft,
}: Readonly<Pick<KitEditorDialogProps, "draft" | "onPatchDraft">>) {
  if (!draft) return null;
  return (
    <KitSection title="Embalagem e logística">
      <p className="text-xs leading-5 text-[#5e574c]">
        O peso é calculado automaticamente pelos produtos e brindes. Informe
        apenas a embalagem final de uma unidade do Kit.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {(
          [
            ["length", "Comprimento (cm)"],
            ["width", "Largura (cm)"],
            ["height", "Altura (cm)"],
          ] as const
        ).map(([key, label]) => (
          <PackageDimensionField
            key={key}
            error={
              draft.invalidDimensionFields.includes(key) ||
              (draft.packageDimensions[key].trim() !== "" &&
                kitDimensionError(key, draft.packageDimensions[key]) !== "")
                ? kitDimensionError(key, draft.packageDimensions[key])
                : ""
            }
            label={label}
            max={KIT_PACKAGE_DIMENSION_RULES[key].max}
            min={KIT_PACKAGE_DIMENSION_RULES[key].min}
            onChange={(value) =>
              onPatchDraft({
                packageDimensions: { ...draft.packageDimensions, [key]: value },
                invalidDimensionFields: draft.invalidDimensionFields.filter(
                  (field) =>
                    field !== key || kitDimensionError(key, value) !== "",
                ),
              })
            }
            range={kitDimensionRange(key)}
            value={draft.packageDimensions[key]}
          />
        ))}
      </div>
    </KitSection>
  );
}

function KitDescriptionsSection({
  draft,
  onPatchDraft,
}: Readonly<Pick<KitEditorDialogProps, "draft" | "onPatchDraft">>) {
  if (!draft) return null;
  return (
    <KitSection title="Descrições">
      <label className="grid gap-2">
        <FieldLabel
          helpText="Resumo curto exibido nas áreas compactas da página do Kit."
          label="Descrição Curta"
        />
        <textarea
          className="min-h-24 resize-y border-2 border-[#1a1a1a] bg-white px-3 py-2 text-sm leading-6 outline-none"
          onChange={(event) =>
            onPatchDraft({ shortDescription: event.target.value })
          }
          value={draft.shortDescription}
        />
      </label>
      <div className="mt-4">
        <LongDescriptionEditor
          onChange={(description) => onPatchDraft({ description })}
          value={draft.description}
        />
      </div>
    </KitSection>
  );
}

function KitMerchandiseSection({
  draft,
  onAddMerchandise,
  onPatchMerchandise,
  onRemoveMerchandise,
  onUploadImage,
  saving,
  uploadingTargets,
}: Readonly<
  Pick<
    KitEditorDialogProps,
    | "draft"
    | "onAddMerchandise"
    | "onPatchMerchandise"
    | "onRemoveMerchandise"
    | "onUploadImage"
    | "saving"
    | "uploadingTargets"
  >
>) {
  if (!draft) return null;
  return (
    <KitSection title="Merchandise e Brindes">
      <p className="text-xs leading-5 text-[#5e574c]">
        Brindes não aparecem na vitrine, mas entram no peso e nas dimensões do
        pacote.
      </p>
      <div className="mt-3 space-y-4">
        {draft.merchandise.map((item, index) => (
          <MerchandiseCard
            item={item}
            key={item.clientId}
            onPatch={onPatchMerchandise}
            onRemove={onRemoveMerchandise}
            onUpload={onUploadImage}
            saving={saving}
            uploading={uploadingTargets.includes(
              `merchandise:${item.clientId}`,
            )}
            index={index}
          />
        ))}
      </div>
      <button
        className="mt-3 inline-flex items-center gap-2 border-2 border-dashed border-[#1a1a1a] px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow"
        onClick={onAddMerchandise}
        type="button"
      >
        <Plus className="size-4" />
        Adicionar brinde
      </button>
    </KitSection>
  );
}

function MerchandiseCard({
  index,
  item,
  onPatch,
  onRemove,
  onUpload,
  saving,
  uploading,
}: Readonly<{
  index: number;
  item: KitDraft["merchandise"][number];
  onPatch: KitEditorDialogProps["onPatchMerchandise"];
  onRemove: KitEditorDialogProps["onRemoveMerchandise"];
  onUpload: KitEditorDialogProps["onUploadImage"];
  saving: boolean;
  uploading: boolean;
}>) {
  return (
    <article className="border-2 border-[#1a1a1a] bg-white">
      <header className="flex items-center justify-between gap-3 border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-[.18em]">
          Brinde {index + 1}
        </p>
        <button
          aria-label={`Remover brinde ${index + 1}`}
          className="grid size-8 place-items-center border-2 border-[#1a1a1a] bg-white hover:bg-[#c0392b] hover:text-white"
          disabled={saving}
          onClick={() => onRemove(item.clientId)}
          type="button"
        >
          <Trash2 className="size-4" />
        </button>
      </header>
      <div className="grid gap-4 p-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <ImageUpload
          imageUrl={item.imageUrl}
          isUploading={uploading}
          onChange={(file) => onUpload(file, `merchandise:${item.clientId}`)}
        />
        <div className="grid content-start gap-3">
          <TextField
            label="Nome"
            onChange={(name) => onPatch(item.clientId, { name })}
            value={item.name}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <NumberField
              label="Qtd."
              onChange={(quantity) => onPatch(item.clientId, { quantity })}
              value={item.quantity}
            />
            {(
              [
                ["weight", "Peso kg"],
                ["length", "Comp. cm"],
                ["width", "Larg. cm"],
                ["height", "Alt. cm"],
              ] as const
            ).map(([key, label]) => (
              <TextField
                key={key}
                label={label}
                onChange={(value) => onPatch(item.clientId, { [key]: value })}
                value={item[key]}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function KitImageSection({
  draft,
  isUploading,
  onUploadImage,
  uploadText,
}: Readonly<{
  draft: KitDraft;
  isUploading: boolean;
  onUploadImage: KitEditorDialogProps["onUploadImage"];
  uploadText: string;
}>) {
  return (
    <KitSection title="Imagem">
      <div className="aspect-square overflow-hidden border-2 border-[#1a1a1a] bg-white">
        {draft.imageUrl ? (
          <img
            alt="Prévia da imagem do Kit"
            className="size-full object-cover"
            src={draft.imageUrl}
          />
        ) : (
          <div className="grid size-full place-items-center p-6 text-center text-xs font-black uppercase leading-5 text-[#6f6758]">
            Imagem obrigatória
          </div>
        )}
      </div>
      <label
        aria-busy={isUploading}
        className="mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-dashed border-[#1a1a1a] text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow has-disabled:cursor-not-allowed has-disabled:opacity-60"
      >
        {isUploading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <ImageIcon className="size-4" />
        )}
        {uploadText}
        <input
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) =>
            selectFile(event, (file) => onUploadImage(file, "kit"))
          }
          type="file"
        />
      </label>
    </KitSection>
  );
}

function KitPriceSection({
  draft,
  onPatchDraft,
  referenceCents,
}: Readonly<{
  draft: KitDraft;
  onPatchDraft: KitEditorDialogProps["onPatchDraft"];
  referenceCents: number;
}>) {
  return (
    <KitSection title="Preço">
      <p className="text-xs text-[#5e574c]">Soma atual dos produtos</p>
      <p className="mt-1 text-2xl font-black">
        {formatBRL(referenceCents / 100)}
      </p>
      <div className="mt-4 space-y-3">
        <TextField
          label="Preço do Kit (R$) *"
          onChange={(price) => onPatchDraft({ price })}
          value={draft.price}
        />
        <TextField
          label="Preço promocional (R$)"
          onChange={(salePrice) => onPatchDraft({ salePrice })}
          value={draft.salePrice ?? ""}
        />
      </div>
    </KitSection>
  );
}

function KitSummary({ draft }: Readonly<{ draft: KitDraft }>) {
  return (
    <section className="border-2 border-[#1a1a1a] bg-brand-yellow p-4">
      <p className="text-[10px] font-black uppercase tracking-[.16em]">
        Resumo
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        <SummaryRow label="Produtos" value={draft.items.length} />
        <SummaryRow label="Brindes" value={draft.merchandise.length} />
        <SummaryRow
          label="Preço do Kit"
          value={formatBRL(parseKitMoney(draft.price))}
          emphasized
        />
      </dl>
    </section>
  );
}

function SummaryRow({
  emphasized = false,
  label,
  value,
}: Readonly<{ emphasized?: boolean; label: string; value: React.ReactNode }>) {
  return (
    <div
      className={`flex justify-between ${emphasized ? "border-t-2 border-[#1a1a1a] pt-2" : ""}`}
    >
      <dt>{label}</dt>
      <dd className="font-black">{value}</dd>
    </div>
  );
}
function ImageUpload({
  imageUrl,
  isUploading,
  onChange,
}: Readonly<{
  imageUrl?: string;
  isUploading: boolean;
  onChange: (file: File) => Promise<void>;
}>) {
  const label = uploadButtonText(isUploading, imageUrl, "");
  return (
    <div className="grid content-start gap-1">
      <p className="text-[9px] font-black uppercase tracking-[.12em]">
        Imagem *
      </p>
      <div className="aspect-square overflow-hidden border-2 border-[#1a1a1a] bg-[#faf8f2]">
        {imageUrl ? (
          <img
            alt="Prévia da imagem do brinde"
            className="size-full object-cover"
            src={imageUrl}
          />
        ) : (
          <div className="grid size-full place-items-center text-center text-[9px] font-black uppercase leading-4 text-[#6f6758]">
            Imagem obrigatória
          </div>
        )}
      </div>
      <label
        aria-busy={isUploading}
        className="mt-1 flex min-h-9 cursor-pointer flex-wrap items-center justify-center gap-1 border-2 border-dashed border-[#1a1a1a] px-2 py-1 text-center text-[9px] font-black uppercase leading-[1.2] hover:bg-brand-yellow has-disabled:cursor-not-allowed has-disabled:opacity-60"
      >
        {isUploading ? (
          <LoaderCircle className="size-3 animate-spin" />
        ) : (
          <ImageIcon className="size-3" />
        )}
        {label}
        <input
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) => selectFile(event, onChange)}
          type="file"
        />
      </label>
    </div>
  );
}
function KitSection({
  children,
  title,
}: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <section>
      <h4 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em]">
        <span className="size-2 rotate-45 bg-brand-yellow" />
        {title}
      </h4>
      {children}
    </section>
  );
}
function TextField({
  label,
  onChange,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string) => void;
  value: string;
}>) {
  return (
    <label className="grid min-w-0 gap-1 text-[9px] font-black uppercase tracking-[.12em]">
      {label}
      <input
        className="h-11 min-w-0 border-2 border-[#1a1a1a] bg-white px-3 text-sm font-medium normal-case tracking-normal"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
function NumberField({
  label,
  onChange,
  value,
}: Readonly<{
  label: string;
  onChange: (value: number) => void;
  value: number;
}>) {
  return (
    <label className="grid min-w-0 gap-1 text-[9px] font-black uppercase tracking-[.12em]">
      {label}
      <input
        className="h-11 min-w-0 border-2 border-[#1a1a1a] bg-white px-3 text-sm font-medium normal-case tracking-normal"
        min="1"
        onChange={(event) => onChange(Math.max(1, Number(event.target.value)))}
        type="number"
        value={value}
      />
    </label>
  );
}
function PackageDimensionField({
  error,
  label,
  max,
  min,
  onChange,
  range,
  value,
}: Readonly<{
  error: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: string) => void;
  range: string;
  value: string;
}>) {
  const inputId = `kit-package-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="grid min-w-0 gap-1">
      <FieldLabel
        helpText="Os Correios calculam o frete pelas medidas da embalagem final já pronta para envio. Informe comprimento, largura e altura da caixa/pacote do Kit; não some as dimensões dos produtos internos."
        label={label}
      />
      <input
        aria-label={label}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error) || undefined}
        className={`h-11 min-w-0 border-2 bg-white px-3 text-sm ${error ? "border-[#c0392b] focus:border-[#c0392b] focus:ring-1 focus:ring-[#c0392b]" : "border-[#1a1a1a]"}`}
        inputMode="decimal"
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step="0.1"
        value={value}
      />
      <p
        className={
          error ? "text-xs font-bold text-[#c0392b]" : "text-xs text-[#5e574c]"
        }
        id={error ? errorId : undefined}
        role={error ? "alert" : undefined}
      >
        {error || `Aceito: ${range}`}
      </p>
    </div>
  );
}
function uploadButtonText(
  isUploading: boolean,
  imageUrl: string | undefined,
  noun: string,
) {
  if (isUploading) return noun ? `Enviando ${noun}…` : "Enviando…";
  return imageUrl
    ? noun
      ? `Trocar ${noun}`
      : "Trocar"
    : noun
      ? `Enviar ${noun}`
      : "Enviar";
}
function selectFile(
  event: React.ChangeEvent<HTMLInputElement>,
  onSelect: (file: File) => Promise<void>,
) {
  const file = event.target.files?.[0];
  event.currentTarget.value = "";
  if (file) onSelect(file).catch(() => undefined);
}
