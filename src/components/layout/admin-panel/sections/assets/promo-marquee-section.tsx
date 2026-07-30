"use client";

import { ArrowDown, ArrowUp, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";

import { CollapsiblePanel } from "@/components/layout/admin-panel/primitives";
import { getPromoMarqueeValidation } from "@/components/layout/promo-marquee/promo-marquee-validation";
import type { HomeFeatureItem, PromoMarqueeItem } from "@/types/home-assets";

import {
  BUTTON_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "./field-classes";
import { IssuesList } from "./issues-list";
import { HomeFeaturesSection } from "./home-features-section";

type PromoMarqueeSectionProps = {
  isSaving: boolean;
  issues: string[];
  messages: PromoMarqueeItem[];
  onAdd: () => void;
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

export function PromoMarqueeSection({
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
  const activeMessages = messages.filter((message) => message.isActive);
  const previewMessages = activeMessages.length > 0 ? [...activeMessages, ...activeMessages] : [];
  const validation = getPromoMarqueeValidation(messages);

  return (
    <CollapsiblePanel
      actions={
        <>
          <button className={SECONDARY_BUTTON_CLASS} disabled={isSaving} onClick={onAdd} type="button">
            <Plus className="h-4 w-4" />
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
      title="Faixa de avisos e promoções"
    >
      {!validation.isValid ? (
        <div
          className="mb-4 rounded-[18px] border border-[#cfbf80] bg-[#fff6bf] px-4 py-4 text-sm leading-6 text-[#231f20]"
          role="alert"
        >
          {validation.message}
        </div>
      ) : null}

      {issues.length > 0 ? <IssuesList issues={issues} /> : null}

      <div className="mt-5 rounded-2xl border border-[#231f20]/10 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5f00]">prévia</p>
            <p className="mt-1 text-sm text-[#5e574c]">Somente mensagens ativas aparecem no site.</p>
          </div>
          <span className="text-xs font-semibold text-[#5e574c]">
            {activeMessages.length} ativa{activeMessages.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-4 flex h-8 items-center overflow-hidden bg-white">
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
            <span className="px-3 text-xs text-[#6f6758]">A faixa ficará oculta sem mensagens ativas.</span>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#231f20]/20 bg-white px-4 py-6 text-sm text-[#5e574c]">
            Nenhuma mensagem cadastrada. Adicione uma para começar.
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div
            className="rounded-2xl border border-[#231f20]/12 bg-white p-4 shadow-[0_8px_18px_rgba(35,31,32,0.03)]"
            key={message.id}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <label className={LABEL_CLASS} htmlFor={`promo-marquee-${message.id}`}>
                    Mensagem {index + 1}
                  </label>
                  <span className="text-xs text-[#6f6758]">
                    Posição {message.order} · {message.text.length}/120
                  </span>
                </div>
                <input
                  className={INPUT_CLASS}
                  disabled={isSaving}
                  id={`promo-marquee-${message.id}`}
                  maxLength={120}
                  onChange={(event) => onChange(message.id, { text: event.target.value })}
                  placeholder="Ex: ⚡ COMPRE 3 LEVE 4 em Sedas"
                  type="text"
                  value={message.text}
                />
              </div>

              <label className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-[#cec7aa] bg-[#fff9ea] px-3 text-sm font-semibold text-[#1e1c10]">
                <input
                  checked={message.isActive}
                  className="h-4 w-4 accent-[#231f20]"
                  disabled={isSaving}
                  onChange={(event) => onChange(message.id, { isActive: event.target.checked })}
                  type="checkbox"
                />
                Ativa
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  aria-label={`Subir mensagem ${index + 1}`}
                  className={SECONDARY_BUTTON_CLASS}
                  disabled={isSaving || index === 0}
                  onClick={() => onMove(message.id, -1)}
                  type="button"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  aria-label={`Descer mensagem ${index + 1}`}
                  className={SECONDARY_BUTTON_CLASS}
                  disabled={isSaving || index === messages.length - 1}
                  onClick={() => onMove(message.id, 1)}
                  type="button"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  className={SECONDARY_BUTTON_CLASS}
                  disabled={isSaving}
                  onClick={() => onRemove(message.id)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <HomeFeaturesSection
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
