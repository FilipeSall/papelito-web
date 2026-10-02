"use client";

import { useEffect, useId, useRef, type RefObject } from "react";
import { FileText, Loader2, PencilLine, Store, X } from "lucide-react";

import { BaseModal } from "@/components/ui/base-modal";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";
import { FOCUS_RING, InlineAlert, PrimaryButton } from "@/components/layout/operational-panel";
import { useVendorCodeEditor } from "@/features/vendor-item-settings/hooks/use-vendor-code-editor";
import type { VendorCodeTarget, VendorItemSettings } from "@/features/vendor-item-settings/types/vendor-item-settings";
import { useVendorProductCustomization } from "@/features/vendor-product-customization/hooks/use-vendor-product-customization";
import type { VendorProductCustomization } from "@/features/vendor-product-customization/types/vendor-product-customization";
import { parseProductDescriptionParagraphs } from "@/utils/html";

import { EditorSectionTitle } from "./editor-section-title";
import { FeedbackBanner } from "./feedback-banner";
import { StockThumb, stockThumbFrameClassName } from "./stock-cells";
import { VendorCodeField } from "./vendor-code-field";

const DESCRIPTION_LIMIT = 20000;

const QUIET_ACTION_CLASS = [
  "inline-flex h-11 cursor-pointer items-center justify-center px-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 transition hover:text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

const SAFE_ACTION_CLASS = [
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-[#f5f1e8] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-white disabled:hover:text-[#1a1a1a]",
  FOCUS_RING,
].join(" ");

const SECTION_DIVIDER_CLASS = "border-t-2 border-[#1a1a1a]/10 pt-6";

type Editor = ReturnType<typeof useVendorProductCustomization>;
type CodeEditor = ReturnType<typeof useVendorCodeEditor>;

/** O que o servidor confirmou num clique de "Salvar"; parte não enviada ou recusada vem `null`. */
export interface ProductEditorResult {
  description: VendorProductCustomization | null;
  vendorCode: VendorItemSettings | null;
  /** Falso quando alguma parte enviada falhou: o editor continua aberto mostrando o erro. */
  complete: boolean;
}

interface DescriptionModalProps {
  /** ID público do pai ou produto comercial do kit; é onde a descrição mora. */
  productId: number;
  /** Nome usado para identificar o recurso no diálogo. */
  productName: string;
  /** Miniatura do item no cabeçalho; vazio cai no ícone padrão de produto. */
  imageUrl?: string;
  /** Item da linha cujo SKU o vendor edita; ausente esconde o campo. */
  vendorCode?: VendorCodeTarget | null;
  /** Fecha o editor quando nenhuma mutação estiver em andamento. */
  onClose: () => void;
  /** Recebe o que o servidor confirmou depois de salvar, mesmo quando só uma parte deu certo. */
  onUpdated: (result: ProductEditorResult) => void;
}

function canonicalText(description: string) {
  return parseProductDescriptionParagraphs(description).join("\n\n");
}

const SOURCE_OPTIONS = [
  { icon: FileText, label: "Papelito", value: false },
  { icon: PencilLine, label: "Meu texto", value: true },
] as const;

function DescriptionSourcePicker({ editor, locked }: Readonly<{ editor: Editor; locked: boolean }>) {
  const name = useId();

  return (
    <div className="grid grid-cols-2 border-2 border-[#1a1a1a] bg-white">
      {SOURCE_OPTIONS.map(({ icon: Icon, label, value }) => (
        <label
          className="relative flex h-11 cursor-pointer items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition-colors first:border-r-2 first:border-[#1a1a1a] hover:bg-brand-yellow/40 has-checked:bg-[#1a1a1a] has-checked:text-brand-yellow has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:z-10 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#1a1a1a] has-focus-visible:shadow-[0_0_0_6px_#ffe500]"
          key={label}
        >
          <input
            checked={editor.showVendorDescription === value}
            className="sr-only"
            disabled={locked}
            name={name}
            onChange={() => editor.setShowVendorDescription(value)}
            type="radio"
          />
          <Icon aria-hidden className="size-4" strokeWidth={2.4} />
          {label}
        </label>
      ))}
    </div>
  );
}

function PapelitoTextPanel({
  editor,
  locked,
  snapshot,
}: Readonly<{ editor: Editor; locked: boolean; snapshot: VendorProductCustomization }>) {
  const text = canonicalText(snapshot.canonicalDescription);
  const keepsOwnText = snapshot.vendorDescription !== null;

  function adopt() {
    editor.setDraft(text);
    editor.setShowVendorDescription(true);
  }

  return (
    <div className="border-2 border-[#1a1a1a] bg-[#f7f2e7]">
      <div className="max-h-64 overflow-y-auto overscroll-contain px-4 py-3.5 text-sm leading-6 whitespace-pre-line text-[#231f20]/82 [scrollbar-width:thin]">
        {text || "Sem descrição completa cadastrada."}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#1a1a1a]/10 px-4 py-3">
        <p className="text-xs leading-5 text-[#231f20]/64">
          {keepsOwnText ? "Seu texto continua guardado para quando você voltar a usá-lo." : "Texto padrão do produto."}
        </p>
        {text ? (
          <button className={SAFE_ACTION_CLASS} disabled={locked} onClick={adopt} type="button">
            <PencilLine aria-hidden className="size-3.5" strokeWidth={2.4} />
            Usar como base
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OwnTextPanel({
  editor,
  locked,
  textareaRef,
}: Readonly<{ editor: Editor; locked: boolean; textareaRef: RefObject<HTMLTextAreaElement | null> }>) {
  const countId = useId();

  return (
    <div>
      <textarea
        aria-describedby={countId}
        aria-invalid={editor.exceedsLimit}
        aria-label="Seu texto para a loja"
        className={[
          "block min-h-56 w-full resize-y border-2 border-[#1a1a1a] bg-white px-4 py-3 text-sm leading-6 text-[#1a1a1a] outline-none transition-colors aria-invalid:border-[#c0392b] disabled:cursor-not-allowed disabled:bg-[#1a1a1a]/4 disabled:text-[#1a1a1a]/64",
          FOCUS_RING,
        ].join(" ")}
        disabled={locked}
        onChange={(event) => editor.setDraft(event.target.value)}
        ref={textareaRef}
        value={editor.draft}
      />
      <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-xs leading-5">
        <p className="text-[#231f20]/58">Deixe uma linha em branco entre parágrafos.</p>
        <p
          className={`ml-auto tabular-nums ${editor.exceedsLimit ? "font-bold text-[#c0392b]" : "text-[#231f20]/58"}`}
          id={countId}
        >
          {editor.characterCount.toLocaleString("pt-BR")} / {DESCRIPTION_LIMIT.toLocaleString("pt-BR")} caracteres
          {editor.exceedsLimit ? " · limite excedido" : ""}
        </p>
      </div>
      <span aria-live="polite" className="sr-only">
        {editor.exceedsLimit ? "Limite de 20.000 caracteres excedido." : ""}
      </span>
    </div>
  );
}

function StoreDescriptionSection({
  editor,
  snapshot,
  textareaRef,
}: Readonly<{ editor: Editor; snapshot: VendorProductCustomization; textareaRef: RefObject<HTMLTextAreaElement | null> }>) {
  const titleId = useId();
  const locked = editor.pending || !snapshot.canEdit;
  const showingOwn = editor.showVendorDescription;

  return (
    <section aria-labelledby={titleId} className="space-y-3">
      <EditorSectionTitle id={titleId}>Descrição na loja</EditorSectionTitle>
      <DescriptionSourcePicker editor={editor} locked={locked} />
      <p className="flex items-center gap-1.5 text-xs leading-5 text-[#231f20]/64">
        <Store aria-hidden className="size-3.5 shrink-0" strokeWidth={2.2} />
        {showingOwn ? "A loja mostra o seu texto." : "A loja mostra o texto da Papelito."}
      </p>
      {showingOwn ? (
        <OwnTextPanel editor={editor} locked={locked} textareaRef={textareaRef} />
      ) : (
        <PapelitoTextPanel editor={editor} locked={locked} snapshot={snapshot} />
      )}
    </section>
  );
}

function EditorBody({
  code,
  codeRef,
  editor,
  textareaRef,
  vendorCode,
}: Readonly<{
  code: CodeEditor;
  codeRef: RefObject<HTMLInputElement | null>;
  editor: Editor;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  vendorCode: VendorCodeTarget | null;
}>) {
  const { snapshot } = editor;

  if (editor.status === "load_error") {
    return (
      <div className="space-y-4">
        <FeedbackBanner feedback={{ error: true, message: editor.error ?? "Não foi possível carregar o produto." }} />
        <button className={SAFE_ACTION_CLASS} onClick={editor.retry} type="button">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!snapshot) {
    return <LogoSpinnerLoader className="min-h-72" label="Carregando produto" />;
  }

  return (
    <div className="space-y-6">
      {snapshot.canEdit ? null : <InlineAlert>Sua conta não pode alterar produtos no momento.</InlineAlert>}
      {vendorCode ? (
        <VendorCodeField editor={code} inputRef={codeRef} locked={!snapshot.canEdit} target={vendorCode} />
      ) : null}
      <div className={vendorCode ? SECTION_DIVIDER_CLASS : undefined}>
        <StoreDescriptionSection editor={editor} snapshot={snapshot} textareaRef={textareaRef} />
      </div>
    </div>
  );
}

function EditorActions({
  canSave,
  editable,
  onCancel,
  onSave,
  pending,
}: Readonly<{
  canSave: boolean;
  editable: boolean;
  onCancel: () => void;
  onSave: () => void;
  pending: boolean;
}>) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
      <button className={QUIET_ACTION_CLASS} disabled={pending} onClick={onCancel} type="button">
        {editable ? "Cancelar" : "Fechar"}
      </button>
      {editable ? (
        <PrimaryButton className="justify-center" disabled={!canSave} onClick={onSave}>
          {pending ? <Loader2 aria-hidden className="size-4 animate-spin" strokeWidth={2.4} /> : null}
          {pending ? "Salvando…" : "Salvar"}
        </PrimaryButton>
      ) : null}
    </div>
  );
}

/** Habilita "Salvar" quando algo mudou e nenhuma parte alterada está inválida. */
function productEditorCanSave(editor: Editor, code: CodeEditor, codeEnabled: boolean) {
  if (editor.pending || code.pending) return false;
  const codeChanged = codeEnabled && code.dirty;
  if (codeChanged && code.tooLong) return false;
  if (editor.dirty && !editor.canSave) return false;
  return codeChanged || editor.dirty;
}

/** Envia só as partes alteradas, em paralelo, e diz se todas as enviadas foram confirmadas. */
async function saveProductEditor(editor: Editor, code: CodeEditor, codeEnabled: boolean): Promise<ProductEditorResult | null> {
  const sendCode = codeEnabled && code.dirty;
  const sendDescription = editor.dirty;
  const [description, vendorCode] = await Promise.all([
    sendDescription ? editor.save() : Promise.resolve(null),
    sendCode ? code.save() : Promise.resolve(null),
  ]);
  if (!description && !vendorCode) return null;
  const complete = (!sendDescription || description !== null) && (!sendCode || vendorCode !== null);
  return { description, vendorCode, complete };
}

function ProductEditor({ productId, productName, imageUrl = "", vendorCode = null, onClose, onUpdated }: Readonly<DescriptionModalProps>) {
  const editor = useVendorProductCustomization(productId);
  const code = useVendorCodeEditor(vendorCode?.itemId ?? 0, vendorCode?.initialCode ?? null, vendorCode?.sku ?? "");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const loaded = editor.snapshot !== null;
  const canEdit = editor.snapshot?.canEdit === true;
  const codeEnabled = vendorCode?.available === true && canEdit;
  const pending = editor.pending || code.pending;

  useEffect(() => {
    if (!loaded || document.activeElement !== closeRef.current) return;
    if (codeEnabled) codeRef.current?.focus();
    else (textareaRef.current ?? bodyRef.current?.querySelector<HTMLInputElement>("input[type=radio]:checked"))?.focus();
  }, [loaded, codeEnabled]);

  function requestClose() {
    if (!editor.isBusy() && !code.isBusy()) onClose();
  }

  async function save() {
    const result = await saveProductEditor(editor, code, codeEnabled);
    if (result) onUpdated(result);
  }

  return (
    <BaseModal ariaLabelledBy={titleId} contentClassName="max-w-2xl" onClose={requestClose} open>
      <div className="flex max-h-[calc(100dvh-3rem)] flex-col border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 shrink-0 bg-brand-yellow" />
        <header className="flex shrink-0 items-center gap-4 border-b-2 border-[#1a1a1a] py-4 pr-3 pl-5 sm:pl-6">
          <span className={`${stockThumbFrameClassName} size-12`}>
            <StockThumb alt="" sizes="48px" src={imageUrl} />
          </span>
          <h2 className="min-w-0 flex-1 text-base leading-5 font-black uppercase tracking-tight wrap-break-word text-[#1a1a1a]" id={titleId}>
            <span className="sr-only">Editar </span>
            {productName}
          </h2>
          <button
            aria-label="Fechar"
            className={`inline-flex size-10 shrink-0 cursor-pointer items-center justify-center border-2 border-transparent text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45 ${FOCUS_RING}`}
            disabled={pending}
            onClick={requestClose}
            ref={closeRef}
            type="button"
          >
            <X aria-hidden className="size-5" strokeWidth={2.4} />
          </button>
        </header>
        <div
          aria-busy={!loaded || pending}
          ref={bodyRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 [scrollbar-color:#1a1a1a40_transparent] [scrollbar-width:thin] sm:px-6"
        >
          <EditorBody code={code} codeRef={codeRef} editor={editor} textareaRef={textareaRef} vendorCode={vendorCode} />
        </div>
        <footer className="shrink-0 space-y-3 border-t-2 border-[#1a1a1a] px-5 py-4 sm:px-6">
          {editor.status === "mutation_error" && editor.error ? (
            <FeedbackBanner feedback={{ error: true, message: editor.error }} />
          ) : null}
          <EditorActions
            canSave={productEditorCanSave(editor, code, codeEnabled)}
            editable={canEdit}
            onCancel={requestClose}
            onSave={() => void save()}
            pending={pending}
          />
        </footer>
      </div>
    </BaseModal>
  );
}

/**
 * Editor do produto para o vendor: o SKU que ele usa no próprio ERP, gravado no item da linha
 * (variação inclusive), e a descrição que a loja mostra, escolhida entre o texto da Papelito e
 * o texto dele. Trocar de item descarta estado e solicitações anteriores; salvar entrega o que o
 * servidor confirmou e cabe a quem abriu fechar o diálogo.
 */
export function VendorProductDescriptionModal(props: Readonly<DescriptionModalProps>) {
  return <ProductEditor key={`${props.productId}-${props.vendorCode?.itemId ?? 0}`} {...props} />;
}
