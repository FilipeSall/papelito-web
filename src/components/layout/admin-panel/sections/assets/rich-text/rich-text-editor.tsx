"use client";

import { Bold, Italic, Plus, Type } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  RichText,
  resolveRichTextDocument,
  type RichTextDocument,
  type RichTextProductFact,
  type RichTextResolutionContext,
} from "@/features/rich-text";

import { COMPACT_BUTTON_CLASS, ICON_BUTTON_CLASS } from "../field-classes";
import { createChipElement } from "./token-chip";
import { serializeEditor } from "./serialize";
import { TokenPicker } from "./token-picker";

type RichTextEditorProps = {
  ariaLabel: string;
  context: RichTextResolutionContext;
  disabled?: boolean;
  id: string;
  maxLength: number;
  onChange: (document: RichTextDocument) => void;
  promotionProducts: RichTextProductFact[];
  value: RichTextDocument;
};

function paintDocument(root: HTMLElement, document: RichTextDocument, products: RichTextProductFact[]) {
  root.replaceChildren();

  for (const node of document) {
    if (node.type === "token") {
      const productId = Number(node.params?.productId);
      const product = products.find((candidate) => candidate.productId === productId);
      root.append(createChipElement(root.ownerDocument, node.token, node.params, product?.name));
      continue;
    }

    let child: Node = root.ownerDocument.createTextNode(node.text);

    if (node.italic) {
      const em = root.ownerDocument.createElement("em");
      em.append(child);
      child = em;
    }

    if (node.bold) {
      const strong = root.ownerDocument.createElement("strong");
      strong.append(child);
      child = strong;
    }

    root.append(child);
  }
}

export function RichTextEditor({
  ariaLabel,
  context,
  disabled = false,
  id,
  maxLength,
  onChange,
  promotionProducts,
  value,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const paintedRef = useRef<string | null>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const serializedValue = JSON.stringify(value);

  useEffect(() => {
    const root = editorRef.current;

    // Repintar o DOM destrói o cursor, e o pai recria o documento a cada render. Só repinta
    // quando o conteúdo realmente mudou por fora do editor.
    if (!root || paintedRef.current === serializedValue) {
      return;
    }

    paintedRef.current = serializedValue;
    paintDocument(root, JSON.parse(serializedValue) as RichTextDocument, promotionProducts);
  }, [promotionProducts, serializedValue]);

  function emitChange() {
    const root = editorRef.current;

    if (root) {
      const next = serializeEditor(root);
      paintedRef.current = JSON.stringify(next);
      onChange(next);
    }
  }

  function applyMark(command: "bold" | "italic") {
    editorRef.current?.focus();
    editorRef.current?.ownerDocument.execCommand(command);
    emitChange();
  }

  function captureSelection() {
    const root = editorRef.current;
    const selection = root?.ownerDocument.getSelection();

    if (root && selection && selection.rangeCount > 0 && root.contains(selection.anchorNode)) {
      selectionRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function insertToken(token: string, params?: Record<string, string>) {
    const root = editorRef.current;

    if (!root) {
      return;
    }

    const productId = Number(params?.productId);
    const product = promotionProducts.find((candidate) => candidate.productId === productId);
    const chip = createChipElement(root.ownerDocument, token, params, product?.name);
    const selection = root.ownerDocument.getSelection();
    const range =
      selectionRangeRef.current ??
      (selection && selection.rangeCount > 0 && root.contains(selection.anchorNode)
        ? selection.getRangeAt(0)
        : null);

    if (range) {
      range.deleteContents();
      range.insertNode(chip);
      range.setStartAfter(chip);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      root.append(chip);
    }

    setIsPickerOpen(false);
    selectionRangeRef.current = null;
    emitChange();
    requestAnimationFrame(() => editorRef.current?.focus());
  }

  const plainLength = value.reduce(
    (total, node) => total + (node.type === "text" ? node.text.length : 0),
    0,
  );
  const preview = useMemo(
    () => resolveRichTextDocument(JSON.parse(serializedValue) as RichTextDocument, context),
    [context, serializedValue],
  );

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-none border-2 border-[#1a1a1a] bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#1a1a1a]/14 bg-[#faf8f2] px-2 py-2">
        <span className="inline-flex items-center gap-1.5 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/56">
          <Type aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} /> Editor
        </span>
        <div aria-label="Formatação" className="flex items-center gap-1" role="toolbar">
        <button
          aria-label="Negrito"
          className={ICON_BUTTON_CLASS}
          disabled={disabled}
          onClick={() => applyMark("bold")}
          type="button"
        >
          <Bold aria-hidden className="h-4 w-4" strokeWidth={2.4} />
        </button>
        <button
          aria-label="Itálico"
          className={ICON_BUTTON_CLASS}
          disabled={disabled}
          onClick={() => applyMark("italic")}
          type="button"
        >
          <Italic aria-hidden className="h-4 w-4" strokeWidth={2.4} />
        </button>
        </div>
        <span aria-hidden className="h-5 w-0.5 bg-[#1a1a1a]/15" />
        <button
          className={COMPACT_BUTTON_CLASS}
          disabled={disabled}
          onClick={() => {
            captureSelection();
            setIsPickerOpen(true);
          }}
          onMouseDown={captureSelection}
          type="button"
        >
          <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
          Inserir dado dinâmico
        </button>
        <span
          aria-live="polite"
          className="ml-auto px-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#231f20]/56"
        >
          {plainLength}/{maxLength}
        </span>
      </div>

      <div
        aria-label={ariaLabel}
        className="min-h-14 w-full px-3 py-3 text-sm text-[#1a1a1a] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a1a1a]"
        contentEditable={!disabled}
        id={id}
        onBlur={emitChange}
        onInput={emitChange}
        ref={editorRef}
        role="textbox"
        suppressContentEditableWarning
        tabIndex={0}
      />
      </div>

      {isPickerOpen ? (
        <TokenPicker
          onClose={() => {
            selectionRangeRef.current = null;
            setIsPickerOpen(false);
          }}
          onSelect={insertToken}
          promotionProducts={promotionProducts}
        />
      ) : null}

      <div className="border-2 border-[#1a1a1a]/14 bg-[#faf8f2] px-3 py-2.5">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/56">
          <span aria-hidden className="inline-block h-2 w-2 rotate-45 bg-brand-yellow" />
          Prévia desta mensagem
        </p>
        <div className="mt-1.5 text-sm text-[#1a1a1a]">
        {preview === null ? (
          <span className="font-bold text-[#c0392b]">
            ⚠ Algum dado dinâmico não está disponível agora — esta mensagem ficaria oculta no site.
          </span>
        ) : (
          <RichText nodes={preview} />
        )}
        </div>
      </div>
    </div>
  );
}
