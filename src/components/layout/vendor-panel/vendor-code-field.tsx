"use client";

import { useId, type RefObject } from "react";
import { CircleAlert, Layers, ScanBarcode, X } from "lucide-react";

import { FOCUS_RING, InlineAlert } from "@/components/layout/operational-panel";
import type { useVendorCodeEditor } from "@/features/vendor-item-settings/hooks/use-vendor-code-editor";
import { VENDOR_CODE_MAX_LENGTH, type VendorCodeTarget } from "@/features/vendor-item-settings/types/vendor-item-settings";

import { EditorSectionTitle } from "./editor-section-title";

type CodeEditor = ReturnType<typeof useVendorCodeEditor>;

interface VendorCodeFieldProps {
  /** Estado do rascunho e da gravação do SKU. */
  editor: CodeEditor;
  /** Item da linha, com o SKU de reserva e a disponibilidade do schema. */
  target: VendorCodeTarget;
  /** Recebe o foco quando o editor abre. */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Conta que não pode alterar produtos: o campo fica só para leitura. */
  locked?: boolean;
}

const COUNTER_FROM = VENDOR_CODE_MAX_LENGTH - 10;

function CodeMessage({ editor }: Readonly<{ editor: CodeEditor }>) {
  const message = editor.tooLong ? `O SKU deve ter no máximo ${VENDOR_CODE_MAX_LENGTH} caracteres.` : editor.error;
  if (!message) return null;
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 font-bold text-[#c0392b]" role={editor.tooLong ? undefined : "alert"}>
      <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.4} />
      <span>{message}</span>
    </p>
  );
}

function CodeClearButton({
  editor,
  inputRef,
  locked,
}: Readonly<{ editor: CodeEditor; inputRef: RefObject<HTMLInputElement | null>; locked: boolean }>) {
  if (!editor.draft || editor.pending || locked) return null;
  return (
    <button
      aria-label="Limpar SKU"
      className={`absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center text-[#1a1a1a]/55 transition hover:bg-brand-yellow hover:text-[#1a1a1a] ${FOCUS_RING}`}
      onClick={() => {
        editor.setDraft("");
        inputRef.current?.focus();
      }}
      type="button"
    >
      <X aria-hidden className="size-4" strokeWidth={2.4} />
    </button>
  );
}

/**
 * Campo SKU do editor de produto. Para o vendor existe um SKU só: o campo abre com o código
 * dele, ou com o SKU de reserva quando ele ainda não definiu um, e nada na tela distingue os dois.
 * Apagar e salvar volta para a reserva; em variação, avisa que o valor vale só para ela.
 */
export function VendorCodeField({ editor, target, inputRef, locked = false }: Readonly<VendorCodeFieldProps>) {
  const fieldId = useId();
  const hintId = useId();

  if (!target.available) {
    return <InlineAlert>O SKU do produto está indisponível no momento.</InlineAlert>;
  }

  const showCounter = editor.length >= COUNTER_FROM;

  return (
    <section className="w-full">
      <EditorSectionTitle htmlFor={fieldId}>SKU</EditorSectionTitle>
      <div className="relative mt-3 w-full">
        <ScanBarcode
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#1a1a1a]/50"
          strokeWidth={2.2}
        />
        <input
          aria-describedby={hintId}
          aria-invalid={editor.tooLong}
          autoComplete="off"
          className={[
            "block h-11 w-full border-2 border-[#1a1a1a] bg-white pr-11 pl-9 font-(family-name:--font-admin-mono) text-sm tracking-[0.04em] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/40 aria-invalid:border-[#c0392b] disabled:cursor-not-allowed disabled:bg-[#1a1a1a]/4",
            FOCUS_RING,
          ].join(" ")}
          disabled={editor.pending || locked}
          id={fieldId}
          onChange={(event) => editor.setDraft(event.target.value)}
          placeholder={target.sku || "Ex.: 000419"}
          ref={inputRef}
          spellCheck={false}
          type="text"
          value={editor.draft}
        />
        <CodeClearButton editor={editor} inputRef={inputRef} locked={locked} />
      </div>
      <div className="mt-2 flex w-full flex-wrap items-start justify-between gap-x-4 gap-y-1 text-xs leading-5 text-[#231f20]/64">
        <p id={hintId}>Use o mesmo código do seu ERP ou planilha de estoque.</p>
        {target.isVariation ? (
          <p className="flex items-center gap-1.5">
            <Layers aria-hidden className="size-3.5 shrink-0" strokeWidth={2.2} />
            <span>Vale só para esta variação</span>
          </p>
        ) : null}
        {showCounter ? <p className="ml-auto tabular-nums">{editor.length} / {VENDOR_CODE_MAX_LENGTH}</p> : null}
      </div>
      <CodeMessage editor={editor} />
    </section>
  );
}
