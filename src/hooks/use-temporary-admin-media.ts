"use client";

import { useCallback, useEffect, useRef } from "react";

import { deleteTemporaryAdminMedia } from "@/lib/client/admin-media-cleanup";

function validIds(ids: Iterable<number>) {
  return Array.from(
    new Set(Array.from(ids).filter((id) => Number.isInteger(id) && id > 0)),
  );
}

export function useTemporaryAdminMedia() {
  const ids = useRef(new Set<number>());
  const savesInFlight = useRef(0);

  const track = useCallback((id: number) => {
    if (Number.isInteger(id) && id > 0) {
      ids.current.add(id);
    }
  }, []);

  const isTracked = useCallback(
    (id: number | undefined) => Boolean(id && ids.current.has(id)),
    [],
  );

  const discard = useCallback(async (mediaIds: Iterable<number>) => {
    const selected = validIds(mediaIds);
    selected.forEach((id) => ids.current.delete(id));
    await deleteTemporaryAdminMedia(selected);
  }, []);

  const discardAllExcept = useCallback(
    async (retainedIds: Iterable<number> = []) => {
      const retained = new Set(validIds(retainedIds));
      const discarded = Array.from(ids.current).filter(
        (id) => !retained.has(id),
      );
      ids.current.clear();
      await deleteTemporaryAdminMedia(discarded);
    },
    [],
  );

  const commit = useCallback((mediaIds: Iterable<number>) => {
    validIds(mediaIds).forEach((id) => ids.current.delete(id));
  }, []);

  const beginSave = useCallback(() => {
    savesInFlight.current += 1;
  }, []);

  const endSave = useCallback(() => {
    savesInFlight.current = Math.max(0, savesInFlight.current - 1);
  }, []);

  useEffect(() => {
    const trackedIds = ids.current;
    return () => {
      if (savesInFlight.current > 0) return;
      const discarded = Array.from(trackedIds);
      trackedIds.clear();
      void deleteTemporaryAdminMedia(discarded).catch(() => undefined);
    };
  }, []);

  return {
    beginSave,
    commit,
    discard,
    discardAllExcept,
    endSave,
    isTracked,
    track,
  };
}
