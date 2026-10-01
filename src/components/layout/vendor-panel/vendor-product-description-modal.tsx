"use client";

import { useId, useState } from "react";
import { BaseModal } from "@/components/ui/base-modal";
import { FOCUS_RING, PrimaryButton } from "@/components/layout/operational-panel";
import { useVendorProductCustomization } from "@/features/vendor-product-customization/hooks/use-vendor-product-customization";
import type { VendorProductCustomization } from "@/features/vendor-product-customization/types/vendor-product-customization";
import { parseProductDescriptionParagraphs } from "@/utils/html";

interface DescriptionModalProps {
  /** ID público do pai ou produto comercial do kit. */
  productId: number;
  /** Nome usado para identificar o recurso no diálogo. */
  productName: string;
  /** Fecha o editor quando nenhuma mutação estiver em andamento. */
  onClose: () => void;
  /** Atualiza todas as linhas que representam o produto normalizado. */
  onUpdated: (view: VendorProductCustomization) => void;
}

function DescriptionEditor({ productId, productName, onClose, onUpdated }: Readonly<DescriptionModalProps>) {
  const editor = useVendorProductCustomization(productId);
  const titleId = useId();
  const textareaId = useId();
  const intentId = useId();
  const lengthId = useId();
  const [feedback, setFeedback] = useState<string | null>(null);

  function close() {
    if (!editor.isBusy()) onClose();
  }

  async function submit(operation: "save" | "restore") {
    setFeedback(null);
    const view = await editor[operation]();
    if (view) {
      setFeedback(operation === "save" ? "Descrição salva." : "Descrição da Papelito restaurada.");
      onUpdated(view);
    }
  }

  return (
    <BaseModal open ariaLabelledBy={titleId} onClose={close} contentClassName="max-w-2xl">
      <div className="max-h-[85vh] overflow-y-auto border-2 border-brand-dark bg-[#faf8f2] p-6 shadow-[8px_8px_0px_#1a1a1a]">
        <h2 id={titleId} className="text-lg font-black text-brand-dark">Editar descrição</h2>
        <p className="mt-1 text-sm text-brand-dark/70">{productName}</p>
        <div aria-live="polite" aria-busy={editor.pending} className="mt-4">
          {editor.status === "loading" ? <p>Carregando descrição…</p> : null}
          {editor.error ? <p role="alert" className="text-sm text-red-800">{editor.error}</p> : null}
          {feedback ? <p className="text-sm">{feedback}</p> : null}
          {editor.status === "load_error" ? <PrimaryButton onClick={editor.retry}>Tentar novamente</PrimaryButton> : null}
        </div>
        {editor.snapshot ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm font-semibold">
              {editor.snapshot.descriptionSource === "vendor" ? "Descrição personalizada" : "Descrição da Papelito"}
            </p>
            <details className="border border-brand-dark/20 bg-white p-3">
              <summary className={"cursor-pointer text-sm font-semibold " + FOCUS_RING}>Referência da Papelito</summary>
              <p className="mt-2 whitespace-pre-line text-sm">{parseProductDescriptionParagraphs(editor.snapshot.canonicalDescription).join("\n\n") || "Sem descrição completa cadastrada."}</p>
            </details>
            {!editor.snapshot.canEdit ? <p role="status" className="text-sm">Sua conta não pode alterar descrições no momento.</p> : null}
            <div>
              <label className="block text-sm font-semibold" htmlFor={textareaId}>Sua descrição</label>
              <textarea
                id={textareaId}
                className={"mt-2 min-h-48 w-full border-2 border-brand-dark bg-white p-3 text-sm " + FOCUS_RING}
                value={editor.draft}
                onChange={(event) => { setFeedback(null); editor.setDraft(event.target.value); }}
                disabled={editor.pending || !editor.snapshot.canEdit}
                aria-describedby={lengthId}
                aria-invalid={editor.exceedsLimit}
              />
              <p className="mt-1 text-xs text-brand-dark/70">Use parágrafos e quebras de linha. Até 20.000 caracteres.</p>
              <p id={lengthId} className="mt-1 text-xs text-brand-dark">{editor.characterCount.toLocaleString("pt-BR")} / 20.000 caracteres{editor.exceedsLimit ? " · Limite excedido." : ""}</p>
            </div>
            {editor.snapshot.vendorDescription === null ? (
              <label className="flex items-center gap-2 text-sm" htmlFor={intentId}>
                <input id={intentId} type="checkbox" checked={editor.intent} disabled={editor.pending || !editor.snapshot.canEdit} onChange={(event) => editor.setIntent(event.target.checked)} />
                Personalizar mesmo mantendo o texto da Papelito
              </label>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {editor.snapshot.vendorDescription !== null ? (
                <PrimaryButton disabled={editor.pending || !editor.snapshot.canEdit} onClick={() => void submit("restore")}>
                  {editor.status === "restoring" ? "Restaurando…" : "Restaurar descrição da Papelito"}
                </PrimaryButton>
              ) : null}
              <PrimaryButton disabled={!editor.canSave} onClick={() => void submit("save")}>
                {editor.status === "saving" ? "Salvando…" : "Salvar descrição"}
              </PrimaryButton>
            </div>
          </div>
        ) : null}
        <button className={"mt-4 text-sm font-semibold underline " + FOCUS_RING} disabled={editor.pending} onClick={close} type="button">Cancelar</button>
      </div>
    </BaseModal>
  );
}

/** Editor isolado por produto: trocar o recurso descarta estado e solicitações anteriores. */
export function VendorProductDescriptionModal(props: Readonly<DescriptionModalProps>) {
  return <DescriptionEditor key={props.productId} {...props} />;
}
