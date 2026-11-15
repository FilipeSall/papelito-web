"use client";

import { useCallback, useMemo, useState } from "react";

import type { ExpoPricesSnapshot } from "@/features/expocannabis/types/admin-prices";
import {
  buildPublishPayload,
  changedPriceIds,
  draftChangeCount,
  draftFromSnapshot,
  draftKitUnitCents,
  invalidPriceIds,
  parseKitPctOff,
  type ExpoPricesDraft,
} from "@/features/expocannabis/utils/admin-prices-draft";

import { useAdminToast } from "../../../primitives";

import { publishExpodayPrices } from "./expoday-prices-service";

/**
 * Estado da aba ExpoDay: o snapshot publicado, o rascunho que o admin edita e a publicação.
 *
 * Re-renderiza a cada tecla nos campos. O rascunho só vira preço no estande quando `publish`
 * termina; em erro (inclusive o 409 de quem publicou antes) o rascunho fica intacto e `error`
 * traz a mensagem do WordPress. Enquanto `saving` é verdadeiro a tela trava os campos: no sucesso
 * o rascunho é trocado pela versão publicada, e uma edição feita no meio seria perdida.
 */
export function useExpodayPrices(initialSnapshot: ExpoPricesSnapshot) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState<ExpoPricesDraft>(() => draftFromSnapshot(initialSnapshot));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const toast = useAdminToast();
  const { showToast } = toast;

  const invalidIds = useMemo(() => invalidPriceIds(snapshot, draft), [snapshot, draft]);
  const changedIds = useMemo(() => changedPriceIds(snapshot, draft), [snapshot, draft]);
  const changeCount = useMemo(() => draftChangeCount(snapshot, draft), [snapshot, draft]);
  const kitUnitCents = useMemo(() => draftKitUnitCents(snapshot, draft), [snapshot, draft]);
  const kitPctInvalid = parseKitPctOff(draft.kitPctOff) === null;

  const setPrice = useCallback((productId: number, raw: string) => {
    setDraft((current) => ({ ...current, prices: { ...current.prices, [productId]: raw } }));
  }, []);

  const setKitPctOff = useCallback((raw: string) => {
    setDraft((current) => ({ ...current, kitPctOff: raw }));
  }, []);

  const discard = useCallback(() => {
    setDraft(draftFromSnapshot(snapshot));
    setError("");
  }, [snapshot]);

  const publish = useCallback(async () => {
    const payload = buildPublishPayload(snapshot, draft);
    if (!payload || saving) return;

    setSaving(true);
    setError("");
    try {
      const published = await publishExpodayPrices(payload);
      setSnapshot(published);
      setDraft(draftFromSnapshot(published));
      showToast({ title: "Preços publicados", description: "O estande cobra os preços novos na próxima cotação." });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível publicar os preços do evento.");
    } finally {
      setSaving(false);
    }
  }, [draft, saving, showToast, snapshot]);

  return {
    changeCount,
    changedIds,
    discard,
    draft,
    error,
    invalidIds,
    kitPctInvalid,
    kitUnitCents,
    publish,
    saving,
    setKitPctOff,
    setPrice,
    snapshot,
    toast,
  };
}
