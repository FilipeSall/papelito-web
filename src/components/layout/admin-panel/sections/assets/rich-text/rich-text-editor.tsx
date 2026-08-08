"use client";

import { Bold, Italic, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  RichText,
  resolveRichTextDocument,
  type RichTextDocument,
  type RichTextProductFact,
  type RichTextResolutionContext,
} from "@/features/rich-text";

import { SECONDARY_BUTTON_CLASS } from "../field-classes";
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
      selection && selection.rangeCount > 0 && root.contains(selection.anchorNode)
        ? selection.getRangeAt(0)
        : null;

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
    emitChange();
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
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <button
          aria-label="Negrito"
          className={SECONDARY_BUTTON_CLASS}
          disabled={disabled}
          onClick={() => applyMark("bold")}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          aria-label="Itálico"
          className={SECONDARY_BUTTON_CLASS}
          disabled={disabled}
          onClick={() => applyMark("italic")}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          className={SECONDARY_BUTTON_CLASS}
          disabled={disabled}
          onClick={() => setIsPickerOpen((open) => !open)}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Inserir dado dinâmico
        </button>
        <span className="ml-auto text-xs text-[#6f6758]">
          {plainLength}/{maxLength}
        </span>
      </div>

      <div
        aria-label={ariaLabel}
        className="min-h-11 w-full rounded-xl border border-[#231f20]/15 bg-white px-3 py-2 text-sm text-[#1e1c10] outline-none focus:border-[#6a5f00] focus:ring-2 focus:ring-[#fee400]/70"
        contentEditable={!disabled}
        id={id}
        onBlur={emitChange}
        onInput={emitChange}
        ref={editorRef}
        role="textbox"
        suppressContentEditableWarning
        tabIndex={0}
      />

      {isPickerOpen ? (
        <TokenPicker
          onCancel={() => setIsPickerOpen(false)}
          onSelect={insertToken}
          promotionProducts={promotionProducts}
        />
      ) : null}

      <p className="mt-1.5 text-xs text-[#4b4731]">
        Prévia:{" "}
        {preview === null ? (
          <span className="text-[#b91c1c]">
            algum dado dinâmico não está disponível agora — esta mensagem ficaria oculta no site.
          </span>
        ) : (
          <RichText nodes={preview} />
        )}
      </p>
    </div>
  );
}
