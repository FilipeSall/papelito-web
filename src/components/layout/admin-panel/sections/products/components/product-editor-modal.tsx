"use client";

import type { ChangeEvent } from "react";
import { X } from "lucide-react";

import { ProductImageFallback } from "@/components/ui";
import { PRODUCT_EDIT_STATUS_OPTIONS, PRODUCT_IMAGE_ACCEPT } from "@/constants/admin-products";
import type {
  ImageUploadTarget,
  ProductDraft,
} from "@/types/admin-products-manager";

import {
  canViewProduct,
  getFrontendProductHref,
  hasValidProductPrice,
  shouldHighlightPriceField,
  shouldHighlightShippingField,
} from "../helpers";
import { AdminSelectField } from "./admin-select-field";
import {
  FieldLabel,
  ModalSection,
  PromotionToggle,
  TextField,
} from "./form-fields";
import { LongDescriptionEditor } from "./long-description-editor";
import { TagInputField } from "./tag-input-field";
import { TaxonomyPicker } from "./taxonomy-picker";
import type { UseAdminProductsManagerReturn } from "@/hooks/use-admin-products-manager";

type ProductEditorModalProps = Pick<
  UseAdminProductsManagerReturn,
  | "draft"
  | "handleCreateTag"
  | "handleSave"
  | "handleUpload"
  | "isCreatingTag"
  | "isPromotionEnabled"
  | "isTaxonomyLoading"
  | "isSaving"
  | "isUploading"
  | "moveImageToCover"
  | "newTagName"
  | "notice"
  | "removeImage"
  | "selectedProduct"
  | "selectedProductId"
  | "setNewTagName"
  | "setTaxonomyCategory"
  | "tags"
  | "taxonomy"
  | "toggleDraftTerm"
  | "togglePromotion"
  | "updateDraft"
> & {
  forceWeightErrorHighlight?: boolean;
  onClose: () => void;
};

export function ProductEditorModal({
  draft,
  forceWeightErrorHighlight = false,
  handleCreateTag,
  handleSave,
  handleUpload,
  isCreatingTag,
  isPromotionEnabled,
  isSaving,
  isTaxonomyLoading,
  isUploading,
  moveImageToCover,
  newTagName,
  notice,
  onClose,
  removeImage,
  selectedProduct,
  selectedProductId,
  setNewTagName,
  setTaxonomyCategory,
  tags,
  taxonomy,
  toggleDraftTerm,
  togglePromotion,
  updateDraft,
}: ProductEditorModalProps) {
  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
    target: ImageUploadTarget,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      void handleUpload(file, target);
    }
  }

  const shippingFieldHighlights = {
    weight: shouldHighlightShippingField({
      field: "weight",
      forceHighlight: forceWeightErrorHighlight,
      selectedProduct,
      selectedProductId,
      value: draft.weight,
    }),
    length: shouldHighlightShippingField({
      field: "length",
      forceHighlight: forceWeightErrorHighlight,
      selectedProduct,
      selectedProductId,
      value: draft.length,
    }),
    width: shouldHighlightShippingField({
      field: "width",
      forceHighlight: forceWeightErrorHighlight,
      selectedProduct,
      selectedProductId,
      value: draft.width,
    }),
    height: shouldHighlightShippingField({
      field: "height",
      forceHighlight: forceWeightErrorHighlight,
      selectedProduct,
      selectedProductId,
      value: draft.height,
    }),
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#231f20]/68 px-3 py-3 backdrop-blur-[3px] md:px-5 md:py-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
    >
      <div className="relative w-full max-w-[75vw]">
        <section
          className="max-h-[calc(100vh-2rem)] overflow-hidden rounded-[14px] border border-[#c9bd96] bg-[#fbf7ef] text-[#231f20] shadow-[0_24px_80px_rgba(35,31,32,0.34)]"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            aria-label="Fechar modal"
            className="group absolute right-5 top-5 z-20 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#231f20]/14 bg-white/92 text-[#231f20] shadow-[0_10px_24px_rgba(35,31,32,0.12)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[#231f20]/28 hover:bg-[#231f20] hover:text-brand-yellow hover:shadow-[0_16px_34px_rgba(35,31,32,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#231f20]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7ef]"
            onClick={onClose}
            type="button"
          >
            <X
              aria-hidden
              className="h-5 w-5 transition duration-200 group-hover:rotate-90"
              strokeWidth={2.2}
            />
          </button>
          <ModalHeader
            draftName={draft.name}
            isCreatingTag={isCreatingTag}
            isSaving={isSaving}
            isUploading={isUploading}
            onSave={handleSave}
            selectedProduct={selectedProduct}
            selectedProductId={selectedProductId}
          />

          {notice ? (
            <output
              aria-live="polite"
              className="border-b border-[#d4c8a4] bg-white px-6 py-3 text-sm text-[#231f20]/78"
            >
              {notice}
            </output>
          ) : null}

          <div className="grid max-h-[calc(100vh-8rem)] gap-6 overflow-y-auto p-6 xl:grid-cols-[minmax(0,1fr)_22.5rem]">
            <div className="space-y-6">
              <BasicInfoSection draft={draft} updateDraft={updateDraft} />
              <PricingSection
                draft={draft}
                isPromotionEnabled={isPromotionEnabled}
                onTogglePromotion={togglePromotion}
                updateDraft={updateDraft}
              />
              <DimensionsSection
                draft={draft}
                highlights={shippingFieldHighlights}
                updateDraft={updateDraft}
              />
              <DescriptionsSection draft={draft} updateDraft={updateDraft} />
            </div>

            <aside className="space-y-6">
              <ImagesSection
                draft={draft}
                isUploading={isUploading}
                onFileChange={handleFileChange}
                onMoveToCover={moveImageToCover}
                onRemoveImage={removeImage}
              />

              <ModalSection
                helpText="A classificação oficial do produto na Papelito."
                title="Classificação"
              >
                <TaxonomyPicker
                  categories={taxonomy.categories}
                  collections={taxonomy.collections}
                  isLoading={isTaxonomyLoading}
                  onCategoryChange={setTaxonomyCategory}
                  onToggleCollection={(slug) => toggleDraftTerm("taxonomyCollections", slug)}
                  onToggleSubcategory={(id) => toggleDraftTerm("taxonomySubcategoryIds", id)}
                  selectedCategoryId={draft.taxonomyCategoryId}
                  selectedCollections={draft.taxonomyCollections}
                  selectedSubcategoryIds={draft.taxonomySubcategoryIds}
                />
              </ModalSection>

              <ModalSection
                helpText="Tags ajudam o cliente a encontrar o produto pela busca por texto. Use palavras-chave que descrevam o item (ex.: vegano, ecologico, pet friendly)."
                title="Tags"
              >
                <TagInputField
                  isCreating={isCreatingTag}
                  newTagName={newTagName}
                  onCreateTag={(name) => handleCreateTag(name, true)}
                  onNewTagNameChange={setNewTagName}
                  onRemoveTag={(id) => toggleDraftTerm("tagIds", id)}
                  selectedIds={draft.tagIds}
                  tags={tags}
                />
              </ModalSection>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}

type DraftUpdater = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => void;

function ModalHeader({
  draftName,
  isCreatingTag,
  isSaving,
  isUploading,
  onSave,
  selectedProduct,
  selectedProductId,
}: Readonly<{
  draftName: string;
  isCreatingTag: boolean;
  isSaving: boolean;
  isUploading: boolean;
  onSave: () => void | Promise<boolean>;
  selectedProduct: UseAdminProductsManagerReturn["selectedProduct"];
  selectedProductId: UseAdminProductsManagerReturn["selectedProductId"];
}>) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#d4c8a4] px-6 py-5 pr-20 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-[#231f20]">
          {selectedProductId === "new" ? "Novo produto" : `Produto #${selectedProductId}`}
        </p>
        <h3 className="mt-1 text-2xl font-semibold leading-tight tracking-normal text-[#0f0f0f]">
          {draftName || "Produto sem nome"}
        </h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {canViewProduct(selectedProduct) ? (
          <a
            className="inline-flex min-h-10 cursor-pointer items-center justify-center border border-[#231f20] bg-white px-6 text-sm font-semibold -tracking-tight text-[#231f20] transition hover:bg-[#f6f0df]"
            href={getFrontendProductHref(selectedProduct)}
            rel="noreferrer"
            target="_blank"
          >
            Ver na Loja
          </a>
        ) : null}
        <button
          className="inline-flex min-h-10 cursor-pointer items-center justify-center border border-brand-yellow bg-brand-yellow px-6 text-sm font-semibold -tracking-tight text-[#231f20] transition hover:bg-[#ead300] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isCreatingTag || isSaving || isUploading}
          onClick={() => void onSave()}
          type="button"
        >
          {isSaving ? "Salvando" : "Salvar Alterações"}
        </button>
      </div>
    </div>
  );
}

function BasicInfoSection({
  draft,
  updateDraft,
}: Readonly<{
  draft: ProductDraft;
  updateDraft: DraftUpdater;
}>) {
  return (
    <ModalSection title="Informações basicas">
      <div className="grid gap-4">
        <TextField
          label="Nome do Produto"
          onChange={(value) => updateDraft("name", value)}
          value={draft.name}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Slug"
            helpText="Endereço amigavel do produto no site. Use texto curto, sem espacos; o WordPress também pode gerar isso automaticamente."
            onChange={(value) => updateDraft("slug", value)}
            value={draft.slug}
          />
          <TextField
            label="SKU"
            helpText="Código interno único do produto para busca e integracoes."
            onChange={(value) => updateDraft("sku", value)}
            value={draft.sku}
          />
        </div>
        <AdminSelectField
          label="Status de Publicacao"
          onChange={(value) => updateDraft("status", value)}
          options={PRODUCT_EDIT_STATUS_OPTIONS}
          placeholder="Status"
          value={draft.status}
        />
      </div>
    </ModalSection>
  );
}

function PricingSection({
  draft,
  isPromotionEnabled,
  onTogglePromotion,
  updateDraft,
}: Readonly<{
  draft: ProductDraft;
  isPromotionEnabled: boolean;
  onTogglePromotion: (isEnabled: boolean) => void;
  updateDraft: DraftUpdater;
}>) {
  const hasInvalidRegularPrice = shouldHighlightPriceField(draft.regularPrice);
  const hasInvalidSalePrice = Boolean(draft.salePrice.trim()) && !hasValidProductPrice(draft.salePrice);

  return (
    <ModalSection title="Precificacao">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          error={hasInvalidRegularPrice}
          inputMode="decimal"
          label="Preço Regular (R$)"
          onChange={(value) => updateDraft("regularPrice", value)}
          value={draft.regularPrice}
        />
        <TextField
          error={hasInvalidSalePrice}
          inputMode="decimal"
          label="Preço Promocional (R$)"
          onChange={(value) => updateDraft("salePrice", value)}
          value={draft.salePrice}
        />
      </div>
      {hasInvalidRegularPrice ? (
        <p className="text-xs font-medium text-[#b42318]" role="alert">
          Informe um preço válido. Produtos sem preço não são exibidos no catálogo.
        </p>
      ) : null}
      {hasInvalidSalePrice ? (
        <p className="text-xs font-medium text-[#b42318]" role="alert">
          Informe um preço promocional válido ou deixe o campo vazio.
        </p>
      ) : null}
      <PromotionToggle
        isDisabled={!hasValidProductPrice(draft.salePrice)}
        isEnabled={isPromotionEnabled}
        onChange={onTogglePromotion}
      />
      {isPromotionEnabled ? (
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Inicio da Promoção"
            onChange={(value) => updateDraft("dateOnSaleFrom", value)}
            type="datetime-local"
            value={draft.dateOnSaleFrom}
          />
          <TextField
            label="Fim da Promoção"
            onChange={(value) => updateDraft("dateOnSaleTo", value)}
            type="datetime-local"
            value={draft.dateOnSaleTo}
          />
        </div>
      ) : null}
    </ModalSection>
  );
}

function DimensionsSection({
  draft,
  highlights = { weight: false, length: false, width: false, height: false },
  updateDraft,
}: Readonly<{
  draft: ProductDraft;
  highlights?: Readonly<{
    weight: boolean;
    length: boolean;
    width: boolean;
    height: boolean;
  }>;
  updateDraft: DraftUpdater;
}>) {
  const anyMissing =
    highlights.weight || highlights.length || highlights.width || highlights.height;

  return (
    <ModalSection title="Dimensões & Logística">
      {anyMissing ? (
        <p className="text-xs font-medium text-[#b42318]">
          Peso e dimensoes (comprimento, largura e altura) sao obrigatorios para calcular o frete
          dos Correios. Produtos sem esses dados não aparecem no catálogo nem podem ser comprados.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          error={highlights.weight}
          helpText="Informe o peso em quilos. Exemplo: 400g deve ser preenchido como 0.4, não como 400."
          inputMode="decimal"
          label="Peso (kg)"
          onChange={(value) => updateDraft("weight", value)}
          placeholder="Ex.: 0.4kg"
          value={draft.weight}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <TextField
          error={highlights.length}
          inputMode="decimal"
          label="Comprimento (cm)"
          onChange={(value) => updateDraft("length", value)}
          value={draft.length}
        />
        <TextField
          error={highlights.width}
          inputMode="decimal"
          label="Largura (cm)"
          onChange={(value) => updateDraft("width", value)}
          value={draft.width}
        />
        <TextField
          error={highlights.height}
          inputMode="decimal"
          label="Altura (cm)"
          onChange={(value) => updateDraft("height", value)}
          value={draft.height}
        />
      </div>
    </ModalSection>
  );
}

function DescriptionsSection({
  draft,
  updateDraft,
}: Readonly<{
  draft: ProductDraft;
  updateDraft: DraftUpdater;
}>) {
  return (
    <ModalSection title="Descrições">
      <label className="grid gap-2">
        <FieldLabel
          helpText="Resumo curto exibido em áreas compactas do produto. Mantenha direto e comercial."
          label="Descrição Curta"
        />
        <textarea
          className="min-h-24 resize-y border border-[#c9bd96] bg-white px-4 py-3 text-sm leading-6 text-[#231f20] outline-none transition placeholder:text-[#231f20]/36 focus:border-[#231f20] focus:ring-1 focus:ring-[#231f20]"
          onChange={(event) => updateDraft("shortDescription", event.target.value)}
          value={draft.shortDescription}
        />
      </label>

      <LongDescriptionEditor
        onChange={(value) => updateDraft("description", value)}
        value={draft.description}
      />
    </ModalSection>
  );
}

function ImagesSection({
  draft,
  isUploading,
  onFileChange,
  onMoveToCover,
  onRemoveImage,
}: Readonly<{
  draft: ProductDraft;
  isUploading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>, target: ImageUploadTarget) => void;
  onMoveToCover: (id: string) => void;
  onRemoveImage: (id: string) => void;
}>) {
  return (
    <ModalSection
      action={
        <label className="cursor-pointer text-sm font-medium text-[#b8a400] transition hover:text-[#231f20]">
          {isUploading ? "Enviando" : "Adicionar"}
          <input
            accept={PRODUCT_IMAGE_ACCEPT}
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => onFileChange(event, "cover")}
            type="file"
          />
        </label>
      }
      title="Imagens"
    >
      <div className="aspect-square overflow-hidden rounded-[3px] border border-[#231f20]/16 bg-[#f1ead9]">
        {draft.images[0]?.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={draft.images[0].alt || draft.name || "Produto"}
            className="h-full w-full object-cover"
            src={draft.images[0].src}
          />
        ) : (
          <ProductImageFallback className="h-full w-full" />
        )}
      </div>

      <div aria-busy={isUploading} className="relative">
        {isUploading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[10px] bg-[#fff9e9]/82 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3 rounded-[14px] border border-[#d7caab] bg-white/88 px-5 py-4 shadow-[0_16px_36px_rgba(35,31,32,0.12)]">
              <span
                aria-hidden
                className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#231f20]/12 border-t-[#231f20]"
              />
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#231f20]">
                  Enviando imagem
                </p>
                <p className="mt-1 text-xs text-[#6e6658]">
                  Aguarde o upload concluir para continuar.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-2">
          {draft.images.slice(0, 4).map((image, index) => (
            <div
              className={[
                "group relative aspect-square overflow-hidden rounded-sm border bg-[#f1ead9]",
                index === 0 ? "border-2 border-brand-yellow" : "border-[#c9bd96]",
              ].join(" ")}
              key={`${image.id}-${image.src}-${index}`}
            >
              {image.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={image.alt || draft.name || "Produto"}
                  className="h-full w-full object-cover"
                  src={image.src}
                />
              ) : (
                <ProductImageFallback className="h-full w-full" />
              )}
              {index > 0 ? (
                <div className="absolute inset-x-1 bottom-1 hidden gap-1 group-hover:flex">
                  <button
                    className="flex-1 cursor-pointer bg-brand-yellow px-1 py-1 text-[9px] font-bold uppercase text-[#231f20]"
                    onClick={() => onMoveToCover(String(image.id))}
                    type="button"
                  >
                    capa
                  </button>
                  <button
                    aria-label="Remover foto secundária"
                    className="cursor-pointer bg-[#231f20] px-1.5 py-1 text-[9px] font-bold text-white"
                    onClick={() => onRemoveImage(String(image.id))}
                    type="button"
                  >
                    x
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          <AdditionalImageInput isUploading={isUploading} onFileChange={onFileChange} />
        </div>
      </div>
    </ModalSection>
  );
}

function AdditionalImageInput({
  isUploading,
  onFileChange,
}: Readonly<{
  isUploading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>, target: ImageUploadTarget) => void;
}>) {
  return (
    <label className="flex aspect-square cursor-pointer items-center justify-center rounded-sm border border-dashed border-[#c9bd96] bg-[#f6f0df] text-2xl font-light text-[#231f20] transition hover:border-[#231f20]">
      {isUploading ? (
        <span
          aria-hidden
          className="h-6 w-6 animate-spin rounded-full border-2 border-[#231f20]/15 border-t-[#231f20]"
        />
      ) : (
        "+"
      )}
      <input
        accept={PRODUCT_IMAGE_ACCEPT}
        className="sr-only"
        disabled={isUploading}
        onChange={(event) => onFileChange(event, "secondary")}
        type="file"
      />
    </label>
  );
}
