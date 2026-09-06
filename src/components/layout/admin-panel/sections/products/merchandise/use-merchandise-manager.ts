"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  AdminMerchandise,
  AdminMerchandiseKitUsage,
} from "@/lib/server/admin-merchandise";
import { messageFromError } from "@/utils/error-message";

import { describeMerchandiseSettlement } from "./merchandise-draft";
import { MerchandiseError, deleteMerchandise } from "./merchandise-service";
import { useMerchandiseForm } from "./use-merchandise-form";

export function useMerchandiseManager(initialMerchandise: AdminMerchandise[]) {
  const [merchandise, setMerchandise] = useState(initialMerchandise);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [blockingKits, setBlockingKits] = useState<AdminMerchandiseKitUsage[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AdminMerchandise | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useMerchandiseForm({
    onSaved: ({ merchandise: saved, unpublishedKits, failedKits }, { isNew }) => {
      setMerchandise((current) => upsertMerchandise(current, saved, isNew));

      const settlement = describeMerchandiseSettlement({
        failedKits,
        isNew,
        name: saved.name,
        unpublishedKits,
      });

      setError(settlement.tone === "error" ? settlement.message : "");
      setNotice(settlement.tone === "success" ? settlement.message : "");
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return term === ""
      ? merchandise
      : merchandise.filter((item) => item.name.toLowerCase().includes(term));
  }, [merchandise, search]);

  const requestDelete = useCallback((item: AdminMerchandise) => {
    setError("");
    setNotice("");
    setBlockingKits([]);
    setDeleteTarget(item);
  }, []);

  const cancelDelete = useCallback(() => {
    if (deletingId) return;
    setDeleteTarget(null);
    setError("");
    setBlockingKits([]);
  }, [deletingId]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setError("");
    try {
      await deleteMerchandise(deleteTarget.id);
      setMerchandise((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      setNotice("Brinde excluído do catálogo.");
    } catch (deleteError) {
      if (deleteError instanceof MerchandiseError) {
        setBlockingKits(deleteError.kits);
      }
      setError(
        messageFromError(deleteError, "Não foi possível excluir o brinde."),
      );
    } finally {
      setDeletingId(null);
    }
  }, [deleteTarget]);

  return {
    blockingKits,
    cancelDelete,
    confirmDelete,
    deleteTarget,
    deletingId,
    error,
    filtered,
    form,
    notice,
    merchandise,
    requestDelete,
    search,
    setSearch,
    total: merchandise.length,
  };
}

function upsertMerchandise(
  current: AdminMerchandise[],
  saved: AdminMerchandise,
  isNew: boolean,
) {
  return isNew
    ? [...current, saved].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    : current.map((item) => (item.id === saved.id ? saved : item));
}
