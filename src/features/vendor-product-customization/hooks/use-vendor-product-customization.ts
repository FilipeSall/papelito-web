"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildDescriptionHtml, parseProductDescriptionParagraphs } from "@/utils/html";
import { getVendorProductCustomization, restoreVendorProductDescription, saveVendorProductCustomization } from "../services/vendor-product-customization-client";
import { getVendorDescriptionLength } from "../utils/description-length";
import type { VendorProductCustomization } from "../types/vendor-product-customization";

type EditorStatus = "loading" | "ready" | "saving" | "restoring" | "load_error" | "mutation_error";

function editorText(view: VendorProductCustomization) {
  return parseProductDescriptionParagraphs(view.vendorDescription ?? view.canonicalDescription).join("\n\n");
}

/** Editor com rascunho independente, trava síncrona e descarte de respostas antigas. */
export function useVendorProductCustomization(productId: number) {
  const [snapshot, setSnapshot] = useState<VendorProductCustomization | null>(null);
  const [draft, setDraft] = useState("");
  const [intent, setIntent] = useState(false);
  const [status, setStatus] = useState<EditorStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);

  const apply = useCallback((view: VendorProductCustomization) => {
    setSnapshot(view);
    setDraft(editorText(view));
    setIntent(false);
    setError(null);
    setStatus("ready");
  }, []);

  useEffect(() => {
    generation.current += 1;
    const version = generation.current;
    const request = new AbortController();
    controller.current = request;
    busy.current = false;
    setSnapshot(null);
    setStatus("loading");
    setError(null);
    getVendorProductCustomization(productId, request.signal).then((view) => {
      if (version === generation.current && !request.signal.aborted) apply(view);
    }).catch((cause: unknown) => {
      if (version !== generation.current || request.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar a descrição.");
      setStatus("load_error");
    });
    return () => {
      generation.current = version + 1;
      controller.current?.abort();
    };
  }, [productId, reload, apply]);

  const dirty = snapshot !== null && draft !== editorText(snapshot);
  const pending = status === "saving" || status === "restoring";
  const characterCount = getVendorDescriptionLength(draft);
  const exceedsLimit = characterCount > 20000;
  const canSave = !exceedsLimit && snapshot?.canEdit === true && !pending && characterCount > 0 && (dirty || intent);

  async function mutate(operation: "saving" | "restoring") {
    if (busy.current || !snapshot?.canEdit) return null;
    if (operation === "saving" && !canSave) return null;
    busy.current = true;
    const version = generation.current;
    const request = new AbortController();
    controller.current = request;
    setStatus(operation);
    setError(null);
    try {
      const view = operation === "saving"
        ? await saveVendorProductCustomization(productId, buildDescriptionHtml(draft.split(/\n{2,}/)), request.signal)
        : await restoreVendorProductDescription(productId, request.signal);
      if (version !== generation.current || request.signal.aborted) return null;
      apply(view);
      return view;
    } catch (cause) {
      if (version !== generation.current || request.signal.aborted) return null;
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar a descrição.");
      setStatus("mutation_error");
      return null;
    } finally {
      if (version === generation.current) busy.current = false;
    }
  }

  return {
    snapshot, draft, setDraft, characterCount, exceedsLimit, intent, setIntent, dirty, status, error, pending, canSave,
    isBusy: () => busy.current, retry: () => setReload((value) => value + 1),
    save: () => mutate("saving"), restore: () => mutate("restoring"),
  };
}
