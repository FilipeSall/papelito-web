"use client";

import { useId, type RefObject } from "react";

import { FOCUS_RING, InlineAlert } from "@/components/layout/operational-panel";
import type { useVendorCodeEditor } from "@/features/vendor-item-settings/hooks/use-vendor-code-editor";
import { VENDOR_CODE_MAX_LENGTH, type VendorCodeTarget } from "@/features/vendor-item-settings/types/vendor-item-settings";

type CodeEditor = ReturnType<typeof useVendorCodeEditor>;

interface VendorCodeFieldProps {
  /** Estado do rascunho e da gravação do código. */
  editor: CodeEditor;
  /** Item da linha, com SKU da Papelito e disponibilidade do schema. */
  target: VendorCodeTarget;
  /** Recebe o foco quando o editor abre. */
  inputRef: RefObject<HTMLInputElement | null>;
}

const CODE_HINT = "O código que você usa para este produto no seu ERP, planilha ou sistema de estoque. Só você vê.";
const COUNTER_FROM = VENDOR_CODE_MAX_LENGTH - 10;

function CodeMessage({ editor }: Readonly<{ editor: CodeEditor }>) {
  if (editor.tooLong) {
    return <p className="mt-1.5 text-xs leading-5 font-bold text-[#c0392b]">O código deve ter no máximo {VENDOR_CODE_MAX_LENGTH} caracteres.</p>;
  }
  if (!editor.error) return null;
  return <p className="mt-1.5 text-xs leading-5 font-bold text-[#c0392b]" role="alert">{editor.error}</p>;
}

/**
 * Campo "Seu código" do editor de produto: o código do ERP do vendor para o item da linha.
 * Mostra o SKU da Papelito só como referência e, em variação, avisa que o código vale só para ela.
 * Vazio é estado válido; salvar vazio remove a associação.
 */
export function VendorCodeField({ editor, target, inputRef }: Readonly<VendorCodeFieldProps>) {
  const fieldId = useId();
  const hintId = useId();
  const referenceId = useId();

  if (!target.available) {
    return <InlineAlert>O código do produto está indisponível no momento.</InlineAlert>;
  }

  const showCounter = editor.length >= COUNTER_FROM;

  return (
    <div>
      <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]" htmlFor={fieldId}>
        Seu código
      </label>
      <p className="mt-1 text-xs leading-5 text-[#231f20]/64" id={hintId}>
        {CODE_HINT}
        {target.isVariation ? " Vale só para esta variação." : ""}
      </p>
      <input
        aria-describedby={`${hintId} ${referenceId}`}
        aria-invalid={editor.tooLong}
        autoComplete="off"
        className={[
          "mt-2 block h-11 w-full max-w-sm border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/40 aria-invalid:border-[#c0392b] disabled:cursor-not-allowed disabled:bg-[#1a1a1a]/4",
          FOCUS_RING,
        ].join(" ")}
        disabled={editor.pending}
        id={fieldId}
        onChange={(event) => editor.setDraft(event.target.value)}
        placeholder="Ex.: 000419"
        ref={inputRef}
        spellCheck={false}
        type="text"
        value={editor.draft}
      />
      <div className="mt-1.5 flex max-w-sm flex-wrap items-start justify-between gap-x-4 text-xs leading-5 text-[#231f20]/58">
        <p id={referenceId}>SKU Papelito: {target.sku || "sem SKU"}</p>
        {showCounter ? <p className="ml-auto tabular-nums">{editor.length} / {VENDOR_CODE_MAX_LENGTH}</p> : null}
      </div>
      <CodeMessage editor={editor} />
    </div>
  );
}
