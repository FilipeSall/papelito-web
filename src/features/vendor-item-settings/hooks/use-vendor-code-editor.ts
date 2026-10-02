"use client";

import { useEffect, useRef, useState } from "react";

import { saveVendorCode } from "../services/vendor-item-settings-client";
import { VENDOR_CODE_MAX_LENGTH, type VendorItemSettings } from "../types/vendor-item-settings";

type CodeStatus = "ready" | "saving" | "error";

/** Mesma normalização visível do WordPress: bordas aparadas e espaços internos colapsados. */
function normalizeCode(value: string) {
  return value.trim().replaceAll(/\s+/g, " ");
}

/**
 * Rascunho do código do vendor para um item, partindo do valor que a listagem já trouxe.
 * `dirty` compara o texto normalizado com o último valor confirmado; salvar com campo vazio
 * remove o código. Respostas que chegam depois de o editor ser desmontado são descartadas.
 */
export function useVendorCodeEditor(itemId: number, initialCode: string | null) {
  const [saved, setSaved] = useState(initialCode ?? "");
  const [draft, setDraft] = useState(initialCode ?? "");
  const [status, setStatus] = useState<CodeStatus>("ready");
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const normalized = normalizeCode(draft);
  const length = Array.from(normalized).length;
  const tooLong = length > VENDOR_CODE_MAX_LENGTH;
  const dirty = normalized !== saved;
  const pending = status === "saving";

  async function save(): Promise<VendorItemSettings | null> {
    if (busy.current || !dirty || tooLong) return null;
    busy.current = true;
    const request = new AbortController();
    controller.current = request;
    setStatus("saving");
    setError(null);
    try {
      const view = await saveVendorCode(itemId, normalized === "" ? null : normalized, request.signal);
      if (request.signal.aborted) return null;
      setSaved(view.vendorCode ?? "");
      setDraft(view.vendorCode ?? "");
      setStatus("ready");
      return view;
    } catch (cause) {
      if (request.signal.aborted) return null;
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o código.");
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
