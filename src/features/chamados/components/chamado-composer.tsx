"use client";

import { Bold, Italic, SendHorizontal } from "lucide-react";
import { useRef, useState } from "react";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import { hardPrimaryActionClass } from "@/components/ui/hard-actions";
import {
  documentToPlainText,
  serializeRichTextDom,
  type RichTextDocument,
} from "@/features/rich-text";

import { CHAMADO_BODY_MAX_NODES, MESSAGE_BODY_MAX_LENGTH } from "../constants";

const TOOL_BUTTON =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-none border-2 border-[#1a1a1a]/20 bg-white text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45 aria-pressed:border-[#1a1a1a] aria-pressed:bg-[#1a1a1a] aria-pressed:text-brand-yellow";

/**
 * Compositor da mensagem: negrito, itálico e quebra de linha.
 *
 * `execCommand` é obsoleto e ainda assim é a escolha certa aqui: a fronteira de sanitização é a
 * leitura, não a entrada — o que qualquer navegador escrever no DOM é normalizado por
 * `serializeRichTextDom`, então HTML colado nunca vira markup no documento persistido. Trocar por
 * uma biblioteca de editor traria ~90KB e um segundo modelo de documento.
 */
export function ChamadoComposer({
  disabled = false,
  onSubmit,
  pending = false,
  pendingLabel = "Enviando…",
  submitLabel = "Enviar",
}: Readonly<{
  disabled?: boolean;
  onSubmit: (message: { content: RichTextDocument; plainText: string }) => void;
  pending?: boolean;
  pendingLabel?: string;
  submitLabel?: string;
}>) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [plainLength, setPlainLength] = useState(0);
  const [marks, setMarks] = useState({ bold: false, italic: false });

  function read(): RichTextDocument {
    const root = editorRef.current;

    return root
      ? serializeRichTextDom(root, {
          allowBreaks: true,
          allowTokens: false,
          maxNodes: CHAMADO_BODY_MAX_NODES,
        })
      : [];
  }

  // `queryCommandState` e `execCommand` são obsoletos e podem simplesmente não existir — o jsdom
  // não os implementa. Sem o guard, o compositor quebra em vez de perder só o realce do botão.
  function commandState(command: "bold" | "italic") {
    const owner = editorRef.current?.ownerDocument;

    try {
      return typeof owner?.queryCommandState === "function" ? owner.queryCommandState(command) : false;
    } catch {
      return false;
    }
  }

  function syncState() {
    // O contador mede a projeção plana, não o `textContent`: é ela que o servidor limita.
    setPlainLength(documentToPlainText(read()).length);
    setMarks({ bold: commandState("bold"), italic: commandState("italic") });
  }

  function applyMark(command: "bold" | "italic") {
    const owner = editorRef.current?.ownerDocument;

    editorRef.current?.focus();

    try {
      if (typeof owner?.execCommand === "function") owner.execCommand(command);
    } catch {
      // Formatação indisponível neste navegador: a mensagem continua enviável como texto.
    }

    syncState();
  }

  function send() {
    const content = read();
    const plainText = documentToPlainText(content).trim();

    if (plainText === "" || disabled || pending) return;

    onSubmit({ content, plainText });

    if (editorRef.current) editorRef.current.replaceChildren();
    syncState();
  }

  const tooLong = plainLength > MESSAGE_BODY_MAX_LENGTH;
  const canSend = plainLength > 0 && !tooLong && !disabled && !pending;

  return (
    <div className="border-t-2 border-[#1a1a1a] bg-[#faf8f2] px-4 py-4 md:px-5">
      <div className="border-2 border-[#1a1a1a] bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#1a1a1a]/14 bg-[#faf8f2] px-2 py-2">
          <div aria-label="Formatação" className="flex items-center gap-1" role="toolbar">
            <button
              aria-label="Negrito"
              aria-pressed={marks.bold}
              className={`${TOOL_BUTTON} ${FOCUS_RING}`}
              disabled={disabled}
              onClick={() => applyMark("bold")}
              type="button"
            >
              <Bold aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <button
              aria-label="Itálico"
              aria-pressed={marks.italic}
              className={`${TOOL_BUTTON} ${FOCUS_RING}`}
              disabled={disabled}
              onClick={() => applyMark("italic")}
              type="button"
            >
              <Italic aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
          <span
            aria-live="polite"
            className={`ml-auto px-1 text-[10px] font-black uppercase tracking-[0.12em] ${
              tooLong ? "text-[#c0392b]" : "text-[#231f20]/56"
            }`}
            data-numeric
          >
            {plainLength}/{MESSAGE_BODY_MAX_LENGTH}
          </span>
        </div>

        <div
          aria-label="Mensagem"
          aria-multiline="true"
          className={`min-h-20 w-full px-3 py-3 text-sm leading-6 text-[#1a1a1a] outline-none ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          } focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-yellow`}
          contentEditable={!disabled}
          data-testid="chamado-composer"
          onInput={syncState}
          onKeyUp={syncState}
          onMouseUp={syncState}
          ref={editorRef}
          role="textbox"
          suppressContentEditableWarning
          tabIndex={0}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
        {tooLong ? (
          <p className="mr-auto text-xs font-bold text-[#c0392b]">
            ⚠ A mensagem passa de {MESSAGE_BODY_MAX_LENGTH} caracteres.
          </p>
        ) : null}
        <button
          className={`${hardPrimaryActionClass} ${FOCUS_RING}`}
          disabled={!canSend}
          onClick={send}
          type="button"
        >
          {pending ? pendingLabel : submitLabel}
          <SendHorizontal aria-hidden className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
