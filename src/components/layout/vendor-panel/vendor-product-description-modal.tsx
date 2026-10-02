"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { Check, ChevronDown, Copy, Loader2, X } from "lucide-react";

import { BaseModal } from "@/components/ui/base-modal";
import { HardSwitch } from "@/components/ui/hard-switch";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";
import { FOCUS_RING, InlineAlert, PrimaryButton } from "@/components/layout/operational-panel";
import { useVendorCodeEditor } from "@/features/vendor-item-settings/hooks/use-vendor-code-editor";
import type { VendorCodeTarget, VendorItemSettings } from "@/features/vendor-item-settings/types/vendor-item-settings";
import { useVendorProductCustomization } from "@/features/vendor-product-customization/hooks/use-vendor-product-customization";
import type { VendorProductCustomization } from "@/features/vendor-product-customization/types/vendor-product-customization";
import { parseProductDescriptionParagraphs } from "@/utils/html";

import { FeedbackBanner } from "./feedback-banner";
import { VendorCodeField } from "./vendor-code-field";

const DESCRIPTION_LIMIT = 20000;

const QUIET_ACTION_CLASS = [
  "inline-flex h-11 cursor-pointer items-center justify-center px-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 transition hover:text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

const SAFE_ACTION_CLASS = [
  "inline-flex h-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-white px-5 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

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
  /** Item da linha cujo código o vendor edita; ausente esconde o campo. */
  vendorCode?: VendorCodeTarget | null;
  /** Fecha o editor quando nenhuma mutação estiver em andamento. */
  onClose: () => void;
  /** Recebe o que o servidor confirmou depois de salvar, mesmo quando só uma parte deu certo. */
  onUpdated: (result: ProductEditorResult) => void;
}

type CopyState = "idle" | "copied" | "failed";

const COPY_FEEDBACK_MS = 2000;

const COPY_FEEDBACK_TEXT: Record<Exclude<CopyState, "idle">, string> = {
  copied: "Texto copiado",
  failed: "Não foi possível copiar",
};

function useCopyToClipboard() {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy(text: string) {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), COPY_FEEDBACK_MS);
  }

  return { copy, state };
}

function CopyFeedback({ state }: Readonly<{ state: CopyState }>) {
  const visible = state !== "idle";
  const failed = state === "failed";

  return (
    <output
      className={`pointer-events-none absolute top-full right-0 z-10 mt-2 inline-flex items-center gap-2 rounded-full border bg-[#231f20] py-1.5 pr-3.5 pl-1.5 text-xs font-black text-white shadow-[0_10px_24px_rgba(35,31,32,0.3)] transition duration-200 ease-out motion-reduce:transition-none ${failed ? "border-[#ef4444]/55" : "border-brand-yellow/40"} ${visible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"}`}
    >
      <span
        aria-hidden
        className={`inline-flex size-5 items-center justify-center rounded-full ${failed ? "bg-[#ef4444] text-white" : "bg-brand-yellow text-[#231f20]"}`}
      >
        {failed ? <X className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}
      </span>
      {visible ? COPY_FEEDBACK_TEXT[state] : ""}
    </output>
  );
}

function PapelitoReference({ description }: Readonly<{ description: string }>) {
  const text = parseProductDescriptionParagraphs(description).join("\n\n");
  const [open, setOpen] = useState(false);
  const regionId = useId();
  const clipboard = useCopyToClipboard();

  return (
    <div className="relative">
      <section
        className={`border-2 bg-white transition-colors duration-300 ${open ? "border-[#1a1a1a]/35" : "border-[#1a1a1a]/15"}`}
      >
        <button
          aria-controls={regionId}
          aria-expanded={open}
          className={`flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left ${FOCUS_RING}`}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span className="min-w-0">
            <span className="block text-sm font-bold text-[#1a1a1a]">Descrição da Papelito</span>
            <span className="mt-0.5 block text-xs leading-5 text-[#231f20]/64">
              Texto padrão, usado sempre que você não personaliza.
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
            {open ? "Ocultar" : "Ver original"}
            <ChevronDown
              aria-hidden
              className={`size-4 transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
              strokeWidth={2.4}
            />
          </span>
        </button>
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
          id={regionId}
          inert={!open}
        >
          <div className="relative min-h-0 overflow-hidden">
            <div className="max-h-56 overflow-y-auto overscroll-contain border-t-2 border-dashed border-[#1a1a1a]/15 px-4 pt-3 pb-12 text-sm leading-6 text-[#231f20]/80 [scrollbar-width:thin]">
              <p className="whitespace-pre-line">{text || "Sem descrição completa cadastrada."}</p>
            </div>
            {text ? (
              <button
                aria-label="Copiar descrição da Papelito"
                className={`absolute right-3 bottom-2.5 inline-flex size-8 cursor-pointer items-center justify-center border-2 border-[#1a1a1a]/15 bg-white text-[#1a1a1a]/70 transition hover:border-[#1a1a1a] hover:bg-brand-yellow hover:text-[#1a1a1a] ${FOCUS_RING}`}
                onClick={() => void clipboard.copy(text)}
                title="Copiar texto"
                type="button"
              >
                <Copy aria-hidden className="size-4" strokeWidth={2.2} />
              </button>
            ) : null}
          </div>
        </div>
      </section>
      <CopyFeedback state={clipboard.state} />
    </div>
  );
}

function describeFieldState(showVendorDescription: boolean, hasSavedText: boolean) {
  if (showVendorDescription) return "É este texto que os compradores da sua loja veem.";
  if (hasSavedText) return "A loja mostra a descrição da Papelito. Este texto fica guardado para quando você voltar a ligar a personalizada.";
  return "Começa com o texto da Papelito. Edite para criar a versão da sua loja.";
}

function DescriptionField({
  editor,
  snapshot,
  textareaRef,
}: Readonly<{
  editor: Editor;
  snapshot: VendorProductCustomization;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}>) {
  const fieldId = useId();
  const hintId = useId();
  const countId = useId();
  const switchId = useId();
  const locked = editor.pending || !snapshot.canEdit;
  const hint = describeFieldState(editor.showVendorDescription, snapshot.vendorDescription !== null);

  return (
    <div>
      <label
        className="block text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
        htmlFor={fieldId}
      >
        Descrição personalizada
      </label>
      <p className="mt-1 text-xs leading-5 text-[#231f20]/64" id={hintId}>
        {hint}
      </p>
      <div className="mt-2">
        <textarea
          aria-describedby={`${hintId} ${countId}`}
          aria-invalid={editor.exceedsLimit}
          className={[
            "block min-h-48 w-full resize-y border-2 border-[#1a1a1a] bg-white px-3 py-2.5 text-sm leading-6 text-[#1a1a1a] outline-none transition-colors aria-invalid:border-[#c0392b] disabled:cursor-not-allowed disabled:bg-[#1a1a1a]/4 disabled:text-[#1a1a1a]/64",
            FOCUS_RING,
          ].join(" ")}
          disabled={locked}
          id={fieldId}
          onChange={(event) => editor.setDraft(event.target.value)}
          ref={textareaRef}
          value={editor.draft}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-xs leading-5">
        <p className="text-[#231f20]/58">Deixe uma linha em branco entre parágrafos.</p>
        <p
          className={`ml-auto tabular-nums ${editor.exceedsLimit ? "font-bold text-[#c0392b]" : "text-[#231f20]/58"}`}
          id={countId}
        >
          {editor.characterCount.toLocaleString("pt-BR")} / {DESCRIPTION_LIMIT.toLocaleString("pt-BR")} caracteres
          {editor.exceedsLimit ? " · limite excedido" : ""}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <HardSwitch
          ariaLabel="Mostrar a descrição personalizada na loja"
          checked={editor.showVendorDescription}
          disabled={locked}
          id={switchId}
          onChange={editor.setShowVendorDescription}
        />
        <label className="cursor-pointer text-sm font-semibold text-[#1a1a1a]" htmlFor={switchId}>
          Mostrar a descrição personalizada na loja
        </label>
      </div>
      <span aria-live="polite" className="sr-only">
        {editor.exceedsLimit ? "Limite de 20.000 caracteres excedido." : ""}
      </span>
    </div>
  );
}

function DescriptionSection({
  editor,
  textareaRef,
}: Readonly<{ editor: Editor; textareaRef: RefObject<HTMLTextAreaElement | null> }>) {
  const { snapshot } = editor;

  if (editor.status === "load_error") {
    return (
      <div className="space-y-4">
        <FeedbackBanner feedback={{ error: true, message: editor.error ?? "Não foi possível carregar a descrição." }} />
        <button className={SAFE_ACTION_CLASS} onClick={editor.retry} type="button">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!snapshot) {
    return <LogoSpinnerLoader className="min-h-80" label="Carregando descrição" />;
  }

  return (
    <div className="space-y-5">
      {snapshot.canEdit ? null : (
        <InlineAlert>Sua conta não pode alterar descrições no momento.</InlineAlert>
      )}
      <PapelitoReference description={snapshot.canonicalDescription} />
      <DescriptionField editor={editor} snapshot={snapshot} textareaRef={textareaRef} />
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
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
      <button
        className={`${QUIET_ACTION_CLASS} sm:ml-auto`}
        disabled={pending}
        onClick={onCancel}
        type="button"
      >
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

function DescriptionEditor({ productId, productName, vendorCode = null, onClose, onUpdated }: Readonly<DescriptionModalProps>) {
  const editor = useVendorProductCustomization(productId);
  const code = useVendorCodeEditor(vendorCode?.itemId ?? 0, vendorCode?.initialCode ?? null);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const loaded = editor.snapshot !== null;
  const codeEnabled = vendorCode?.available === true;
  const pending = editor.pending || code.pending;
  const editable = codeEnabled || editor.snapshot?.canEdit === true;
  const descriptionClassName = vendorCode ? "border-t-2 border-dashed border-[#1a1a1a]/15 pt-5" : undefined;

  useEffect(() => {
    if (document.activeElement !== closeRef.current) return;
    if (codeEnabled) codeRef.current?.focus();
    else if (loaded) textareaRef.current?.focus();
  }, [loaded, codeEnabled]);

  function requestClose() {
    if (!editor.isBusy() && !code.isBusy()) onClose();
  }

  async function save() {
    const result = await saveProductEditor(editor, code, codeEnabled);
    if (result) onUpdated(result);
  }

  return (
    <BaseModal
      ariaLabelledBy={titleId}
      contentClassName="max-w-3xl"
      onClose={requestClose}
      open
    >
      <div className="flex max-h-[calc(100dvh-3rem)] flex-col border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 shrink-0 bg-brand-yellow" />
        <header className="flex shrink-0 items-start justify-between gap-4 border-b-2 border-[#1a1a1a] py-4 pr-3 pl-5 sm:pl-6">
          <div className="min-w-0 pt-1">
            <h2 className="text-lg leading-6 font-black uppercase tracking-tight text-[#1a1a1a]" id={titleId}>
              Editar produto
            </h2>
            <p className="mt-1 text-sm leading-5 wrap-break-word text-[#231f20]/70">{productName}</p>
          </div>
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
          className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-color:#1a1a1a40_transparent] [scrollbar-width:thin] sm:px-6"
        >
          {vendorCode ? <VendorCodeField editor={code} inputRef={codeRef} target={vendorCode} /> : null}
          <div className={descriptionClassName}>
            <DescriptionSection editor={editor} textareaRef={textareaRef} />
          </div>
        </div>
        <footer className="shrink-0 space-y-3 border-t-2 border-[#1a1a1a] px-5 py-4 sm:px-6">
          {editor.status === "mutation_error" && editor.error ? (
            <FeedbackBanner feedback={{ error: true, message: editor.error }} />
          ) : null}
          <EditorActions
            canSave={productEditorCanSave(editor, code, codeEnabled)}
            editable={editable}
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
 * Editor do produto para o vendor: o código do ERP dele para o item da linha e a descrição
 * que a loja mostra no lugar do texto da Papelito. O código grava no item (variação inclusive);
 * a descrição, no pai. Trocar de item descarta estado e solicitações anteriores; salvar entrega
 * o que o servidor confirmou e cabe a quem abriu fechar o diálogo.
 */
export function VendorProductDescriptionModal(props: Readonly<DescriptionModalProps>) {
  return <DescriptionEditor key={`${props.productId}-${props.vendorCode?.itemId ?? 0}`} {...props} />;
}
