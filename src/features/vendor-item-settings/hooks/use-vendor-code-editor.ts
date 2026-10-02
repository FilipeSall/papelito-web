"use client";

import { useEffect, useRef, useState } from "react";

import { saveVendorCode } from "../services/vendor-item-settings-client";
import { VENDOR_CODE_MAX_LENGTH, type VendorItemSettings } from "../types/vendor-item-settings";

type CodeStatus = "ready" | "saving" | "error";

/** Mesma normalização visível do WordPress: bordas aparadas e espaços internos colapsados. */
function normalizeCode(value: string) {
  return value.trim().replaceAll(/\s+/g, " ");
}

/** Vazio ou igual ao SKU de reserva quer dizer "sem código próprio": grava `null`. */
function codeToSend(normalized: string, fallbackSku: string) {
  return normalized === "" || normalized === fallbackSku ? null : normalized;
}

/**
 * Rascunho do SKU que o vendor vê para um item: o código dele quando existe, senão o SKU da
 * Papelito como reserva. O vendor edita um campo só; apagar ou voltar ao SKU de reserva grava
 * `null`, e o campo volta a mostrar a reserva. `dirty` compara o que seria gravado com o último
 * valor confirmado. Respostas que chegam depois de o editor ser desmontado são descartadas.
 */
export function useVendorCodeEditor(itemId: number, initialCode: string | null, fallbackSku: string) {
  const [saved, setSaved] = useState<string | null>(initialCode);
  const [draft, setDraft] = useState(initialCode ?? fallbackSku);
  const [status, setStatus] = useState<CodeStatus>("ready");
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const normalized = normalizeCode(draft);
  const pendingValue = codeToSend(normalized, fallbackSku);
  const length = Array.from(normalized).length;
  const tooLong = length > VENDOR_CODE_MAX_LENGTH;
  const dirty = pendingValue !== saved;
  const pending = status === "saving";

  async function save(): Promise<VendorItemSettings | null> {
    if (busy.current || !dirty || tooLong) return null;
    busy.current = true;
    const request = new AbortController();
    controller.current = request;
    setStatus("saving");
    setError(null);
    try {
      const view = await saveVendorCode(itemId, pendingValue, request.signal);
      if (request.signal.aborted) return null;
      setSaved(view.vendorCode);
      setDraft(view.vendorCode ?? fallbackSku);
      setStatus("ready");
      return view;
    } catch (cause) {
      if (request.signal.aborted) return null;
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o SKU.");
      setStatus("error");
      return null;
    } finally {
      busy.current = false;
    }
  }

  return {
    draft, setDraft, dirty, tooLong, length, status, error, pending,
    isBusy: () => busy.current,
    save,
  };
}
