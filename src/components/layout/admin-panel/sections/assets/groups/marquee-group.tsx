"use client";

import { ArrowDown, ArrowUp, LoaderCircle, Megaphone, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import { ResultFrame } from "@/components/layout/admin-panel/primitives";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { getPromoMarqueeValidation } from "@/components/layout/promo-marquee/promo-marquee-validation";
import {
  resolveRichTextDocument,
  resolveRichTextSource,
  type RichTextResolutionContext,
} from "@/features/rich-text";
import type { PromoMarqueeItem } from "@/types/home-assets";

import { AssetEditorModal } from "../asset-editor-modal";
import { AssetNotice, AssetWarning, type AssetNoticeState } from "../asset-notice";
import { AssetEmptyRow, AssetIconThumb, AssetRow } from "../asset-row";
import {
  COMPACT_DESTRUCTIVE_CLASS,
  COMPACT_PRIMARY_CLASS,
  COMPACT_SECONDARY_CLASS,
  HARD_BOX_CLASS,
  ROW_ICON_BUTTON_CLASS,
} from "../assets-classes";
import { isSameAsset } from "../assets-dirty";
import { attentionSuffix, countAttention, marqueeMessageStatus } from "../assets-status";
import { MarqueeMessageEditor } from "../editors/marquee-message-editor";

export function MarqueeGroup({
  isSaving,
  issues,
  messages,
  notice,
  onAdd,
  onChange,
  onMove,
  onRemove,
  onSave,
  persistedMessages,
  richTextContext,
}: {
  isSaving: boolean;
  issues: string[];
  messages: PromoMarqueeItem[];
  notice: AssetNoticeState | null;
  onAdd: () => string;
  onChange: (id: string, patch: Partial<PromoMarqueeItem>) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onSave: () => Promise<boolean>;
  persistedMessages: PromoMarqueeItem[];
  richTextContext: RichTextResolutionContext;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [messageToRemove, setMessageToRemove] = useState<string | null>(null);
  const validation = getPromoMarqueeValidation(messages);
  const statuses = messages.map(marqueeMessageStatus);
  const attention = countAttention(statuses);
  const isDirty = !isSameAsset(messages, persistedMessages);
  const editingIndex = messages.findIndex((message) => message.id === editingId);
  const editingMessage = editingIndex >= 0 ? messages[editingIndex] : null;

  const activeMessages = messages.filter((message) => message.isActive);
  const resolvedMessages = activeMessages.flatMap((message) => {
    const nodes = resolveRichTextDocument(
      resolveRichTextSource(message.content, message.text),
      richTextContext,
    );
    return nodes === null ? [] : [{ ...message, text: nodes.map((node) => node.text).join("") }];
  });
  const previewMessages =
    resolvedMessages.length > 0 ? [...resolvedMessages, ...resolvedMessages] : [];

  async function handleSave() {
    const saved = await onSave();
    if (saved) {
      setEditingId(null);
    }
  }

  return (
    <>
      <ResultFrame
        action={
          <>
            <button
              className={COMPACT_SECONDARY_CLASS}
              disabled={isSaving}
              onClick={() => setEditingId(onAdd())}
              type="button"
            >
              <Plus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              Nova mensagem
            </button>
            <button
              className={COMPACT_PRIMARY_CLASS}
              disabled={isSaving || !isDirty || !validation.isValid}
              onClick={() => void handleSave()}
              type="button"
            >
              {isSaving ? (
                <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <Save aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              )}
              Salvar faixa
            </button>
          </>
        }
        notice={
          <div className="space-y-3">
            {!validation.isValid ? <AssetWarning>{validation.message}</AssetWarning> : null}
            {issues.length > 0 ? <AssetWarning>{issues.join(" ")}</AssetWarning> : null}
            {notice && !editingId ? <AssetNotice notice={notice} /> : null}

            <div className={HARD_BOX_CLASS}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
                  Prévia — somente mensagens ativas aparecem no site
                </p>
                <span className="inline-flex shrink-0 items-center border-2 border-[#1a1a1a] bg-brand-yellow px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
                  {activeMessages.length} ativa{activeMessages.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-3 flex h-8 items-center overflow-hidden border-2 border-[#1a1a1a]/10 bg-white">
                {previewMessages.length > 0 ? (
                  <div className="flex animate-marquee whitespace-nowrap">
                    {previewMessages.map((message, index) => (
                      <span
                        className="px-8 text-xs font-black uppercase leading-4 tracking-[0.6px] text-[#231f20]"
                        key={`${message.id}-preview-${index}`}
                      >
                        {message.text}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="px-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#231f20]/48">
                    A faixa ficará oculta sem mensagens ativas.
                  </span>
                )}
              </div>
            </div>
          </div>
        }
        summary={`Faixa de avisos · ${messages.length} mensage${messages.length === 1 ? "m" : "ns"}${attentionSuffix(attention)}`}
      >
        {messages.length === 0 ? (
          <AssetEmptyRow
            body="A faixa fica oculta no site enquanto não houver mensagem ativa. Crie a primeira para começar."
            title="Nenhuma mensagem cadastrada"
          />
        ) : null}

        {messages.map((message, index) => (
          <AssetRow
            actions={
              <span className="flex items-center gap-2">
                <button
                  aria-label={`Subir mensagem ${index + 1}`}
                  className={ROW_ICON_BUTTON_CLASS}
                  disabled={isSaving || index === 0}
                  onClick={() => onMove(message.id, -1)}
                  type="button"
                >
                  <ArrowUp aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
                <button
                  aria-label={`Descer mensagem ${index + 1}`}
                  className={ROW_ICON_BUTTON_CLASS}
                  disabled={isSaving || index === messages.length - 1}
                  onClick={() => onMove(message.id, 1)}
                  type="button"
                >
                  <ArrowDown aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
                <button
                  aria-label={`Remover mensagem ${index + 1}`}
                  className={COMPACT_DESTRUCTIVE_CLASS}
                  disabled={isSaving}
                  onClick={() => setMessageToRemove(message.id)}
                  type="button"
                >
                  <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
              </span>
            }
            isUnsaved={
              !isSameAsset(
                message,
                persistedMessages.find((persisted) => persisted.id === message.id),
              )
            }
            key={message.id}
            onOpen={() => setEditingId(message.id)}
            status={statuses[index]}
            thumbnail={
              <AssetIconThumb
                icon={Megaphone}
                label={`Mensagem ${index + 1}`}
                tone={message.isActive ? "yellow" : "light"}
              />
            }
            title={message.text.trim() || `Mensagem ${index + 1} sem texto`}
            where={`Posição ${message.order} na faixa`}
          />
        ))}
      </ResultFrame>

      {editingMessage ? (
        <AssetEditorModal
          description="Texto simples com dados dinâmicos, até 120 caracteres. A ordem da lista é a ordem pública."
          eyebrow="Painel admin · Assets · Home"
          isSaveDisabled={!validation.isValid}
          isSaving={isSaving}
          notice={notice}
          onClose={() => setEditingId(null)}
          onSave={() => void handleSave()}
          open
          saveLabel="Salvar faixa"
          title={`Faixa de avisos · mensagem ${editingIndex + 1}`}
        >
          <MarqueeMessageEditor
            index={editingIndex}
            isSaving={isSaving}
            message={editingMessage}
            onChange={(patch) => onChange(editingMessage.id, patch)}
            richTextContext={richTextContext}
          />
        </AssetEditorModal>
      ) : null}

      <ConfirmModal
        confirmLabel="Remover mensagem"
        description="A mensagem sai da faixa promocional da home assim que você salvar as alterações."
        onClose={() => setMessageToRemove(null)}
        onConfirm={() => {
          if (messageToRemove) {
            onRemove(messageToRemove);
            if (editingId === messageToRemove) {
              setEditingId(null);
            }
          }
          setMessageToRemove(null);
        }}
        open={messageToRemove !== null}
        title="Remover mensagem da faixa"
        tone="danger"
      />
    </>
  );
}
