"use client";

import { ArrowDown, ArrowUp, ChevronDown, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { CollapsiblePanel } from "@/components/layout/admin-panel/primitives";
import { getPromoMarqueeValidation } from "@/components/layout/promo-marquee/promo-marquee-validation";
import {
  documentToPlainText,
  resolveRichTextDocument,
  resolveRichTextSource,
  type RichTextResolutionContext,
} from "@/features/rich-text";
import type { HomeFeatureItem, PromoMarqueeItem } from "@/types/home-assets";

import {
  ALERT_WARNING_CLASS,
  BUTTON_CLASS,
  CARD_CLASS,
  CARD_HEADER_CLASS,
  COMPACT_BUTTON_CLASS,
  DASHED_BOX_CLASS,
  DESTRUCTIVE_BUTTON_CLASS,
  DIAMOND_CLASS,
  ICON_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  SUBPANEL_CLASS,
} from "./field-classes";
import { IssuesList } from "./issues-list";
import { RichTextEditor } from "./rich-text/rich-text-editor";
import { HomeFeaturesSection } from "./home-features-section";

type PromoMarqueeSectionProps = {
  richTextContext: RichTextResolutionContext;
  isSaving: boolean;
  issues: string[];
  messages: PromoMarqueeItem[];
  onAdd: () => string | void;
  onChange: (id: string, patch: Partial<PromoMarqueeItem>) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onSave: () => void;
  featureItems: HomeFeatureItem[];
  featureIssues: string[];
  isSavingFeatures: boolean;
  onFeatureChange: (id: string, patch: Partial<HomeFeatureItem>) => void;
  onFeatureSave: () => void;
  onFeatureUploadIcon: (id: string, file: File) => void | Promise<void>;
  featureUploadingId: string | null;
};

type PromoMarqueeMessageCardProps = {
  index: number;
  isOpen: boolean;
  isSaving: boolean;
  message: PromoMarqueeItem;
  messagesCount: number;
  onChange: (id: string, patch: Partial<PromoMarqueeItem>) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onToggle: () => void;
  promotionProducts: RichTextResolutionContext["promotionProducts"];
  richTextContext: RichTextResolutionContext;
};

function PromoMarqueeMessageCard({
  index,
  isOpen,
  isSaving,
  message,
  messagesCount,
  onChange,
  onMove,
  onRemove,
  onToggle,
  promotionProducts,
  richTextContext,
}: PromoMarqueeMessageCardProps) {
  const regionId = useId();

  return (
    <article className={CARD_CLASS} id={`promo-message-card-${message.id}`}>
      <header
        className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${CARD_HEADER_CLASS}`}
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
            Mensagem {index + 1}
          </p>
          <p className="mt-1.5 text-xs font-semibold text-[#231f20]/70">
            Posição {message.order} na faixa pública
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label
            className={`inline-flex h-9 w-fit cursor-pointer items-center gap-2 rounded-none border-2 px-3 text-[10px] font-black uppercase tracking-[0.14em] transition ${
              message.isActive
                ? "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]"
                : "border-[#1a1a1a]/20 bg-white text-[#231f20]/60"
            }`}
          >
            <input
              checked={message.isActive}
              className="h-4 w-4 accent-[#1a1a1a]"
              disabled={isSaving}
              onChange={(event) => onChange(message.id, { isActive: event.target.checked })}
              type="checkbox"
            />
            {message.isActive ? "Ativa" : "Inativa"}
          </label>
          <button
            aria-controls={regionId}
            aria-expanded={isOpen}
            aria-label={isOpen ? `Recolher mensagem ${index + 1}` : `Expandir mensagem ${index + 1}`}
            className={ICON_BUTTON_CLASS}
            onClick={onToggle}
            type="button"
          >
            <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </header>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div
          aria-label={`Editor da mensagem ${index + 1}`}
          className="overflow-hidden"
          id={regionId}
          inert={!isOpen}
          role="region"
        >
          <div className="p-4">
            <RichTextEditor
              ariaLabel={`Mensagem ${index + 1}`}
              context={richTextContext}
              disabled={isSaving}
              id={`promo-marquee-${message.id}`}
              maxLength={120}
              onChange={(content) => onChange(message.id, { content, text: documentToPlainText(content) })}
              promotionProducts={promotionProducts}
              value={resolveRichTextSource(message.content, message.text)}
            />
          </div>

          <footer className="flex flex-col gap-3 border-t-2 border-[#231f20]/10 bg-[#faf8f2] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/48">
              Ações administrativas desta mensagem
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                aria-label={`Subir mensagem ${index + 1}`}
                className={COMPACT_BUTTON_CLASS}
                disabled={isSaving || index === 0}
                onClick={() => onMove(message.id, -1)}
                type="button"
              >
                <ArrowUp aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                Subir
              </button>
              <button
                aria-label={`Descer mensagem ${index + 1}`}
                className={COMPACT_BUTTON_CLASS}
                disabled={isSaving || index === messagesCount - 1}
                onClick={() => onMove(message.id, 1)}
                type="button"
              >
                <ArrowDown aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                Descer
              </button>
              <button
                className={DESTRUCTIVE_BUTTON_CLASS}
                disabled={isSaving}
                onClick={() => onRemove(message.id)}
                type="button"
              >
                <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                Remover
              </button>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}

export function PromoMarqueeSection({
  richTextContext,
  isSaving,
  issues,
  messages,
  onAdd,
  onChange,
  onMove,
  onRemove,
  onSave,
  featureItems,
  featureIssues,
  isSavingFeatures,
  onFeatureChange,
  onFeatureSave,
  onFeatureUploadIcon,
  featureUploadingId,
}: PromoMarqueeSectionProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(() => new Set());
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const activeMessages = messages.filter((message) => message.isActive);
  const resolvedMessages = activeMessages.flatMap((message) => {
    const nodes = resolveRichTextDocument(
      resolveRichTextSource(message.content, message.text),
      richTextContext,
    );
    return nodes === null ? [] : [{ ...message, text: nodes.map((node) => node.text).join("") }];
  });
  const previewMessages = resolvedMessages.length > 0 ? [...resolvedMessages, ...resolvedMessages] : [];
  const validation = getPromoMarqueeValidation(messages);

  function toggleMessage(id: string) {
    setExpandedMessageIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function addMessage() {
    const id = onAdd();
    if (id) {
      setExpandedMessageIds((current) => new Set(current).add(id));
      setIsPanelOpen(true);
      setPendingMessageId(id);
    }
  }

  useEffect(() => {
    if (!pendingMessageId) {
      return;
    }

    const card = document.getElementById(`promo-message-card-${pendingMessageId}`);
    const editor = document.getElementById(`promo-marquee-${pendingMessageId}`);
    if (!card || !editor) {
      return;
    }

    card.scrollIntoView?.({ behavior: "smooth", block: "center" });
    editor.focus({ preventScroll: true });
    setPendingMessageId(null);
  }, [messages, pendingMessageId]);

  return (
    <CollapsiblePanel
      actions={
        <>
          <button className={SECONDARY_BUTTON_CLASS} disabled={isSaving} onClick={addMessage} type="button">
            <Plus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            Nova mensagem
          </button>
          <button
            className={BUTTON_CLASS}
            disabled={isSaving || !validation.isValid}
            onClick={onSave}
            type="button"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar faixa
          </button>
        </>
      }
      description="Edite as mensagens exibidas no topo do site. A ordem abaixo é a ordem pública; a repetição necessária para a animação é criada somente na apresentação."
      eyebrow="home"
      hint="Texto simples, até 120 caracteres por mensagem."
      onOpenChange={setIsPanelOpen}
      open={isPanelOpen}
      title="Faixa de avisos e promoções"
    >
      {!validation.isValid ? (
        <div className={`mb-4 ${ALERT_WARNING_CLASS}`} role="alert">
          ⚠ {validation.message}
        </div>
      ) : null}

      {issues.length > 0 ? <IssuesList issues={issues} /> : null}

      <div className={`mt-5 ${SUBPANEL_CLASS}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
              <span aria-hidden className={DIAMOND_CLASS} />
              Prévia
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[#231f20]/70">
              Somente mensagens ativas aparecem no site.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center border-2 border-[#1a1a1a] bg-brand-yellow px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
            {activeMessages.length} ativa{activeMessages.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-4 flex h-8 items-center overflow-hidden border-2 border-[#1a1a1a]/14 bg-white">
          {previewMessages.length > 0 ? (
            <div className="flex whitespace-nowrap animate-marquee">
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

      <div className="mt-5 space-y-3">
        {messages.length === 0 ? (
          <div className={DASHED_BOX_CLASS}>
            Nenhuma mensagem cadastrada. Adicione uma para começar.
          </div>
        ) : null}

        {messages.map((message, index) => (
          <PromoMarqueeMessageCard
            index={index}
            isOpen={expandedMessageIds.has(message.id)}
            isSaving={isSaving}
            key={message.id}
            message={message}
            messagesCount={messages.length}
            onChange={onChange}
            onMove={onMove}
            onRemove={onRemove}
            onToggle={() => toggleMessage(message.id)}
            promotionProducts={richTextContext.promotionProducts}
            richTextContext={richTextContext}
          />
        ))}
      </div>

      <HomeFeaturesSection
        richTextContext={richTextContext}
        isSaving={isSavingFeatures}
        issues={featureIssues}
        items={featureItems}
        onChange={onFeatureChange}
        onSave={onFeatureSave}
        onUploadIcon={onFeatureUploadIcon}
        uploadingId={featureUploadingId}
      />
    </CollapsiblePanel>
  );
}
