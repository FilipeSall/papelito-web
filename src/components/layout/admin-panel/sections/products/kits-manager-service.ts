import type { AdminKit, AdminKitDeletion } from "@/lib/server/admin-kits";

import { toKitPayload } from "./kits-manager-draft";
import type { KitDraft } from "./kits-manager-types";

type SaveResponse = { kit?: AdminKit; message?: string };

export async function saveKitDraft(draft: KitDraft): Promise<AdminKit> {
  const response = await fetch(
    draft.id ? `/api/admin/kits/${draft.id}` : "/api/admin/kits",
    {
      method: draft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toKitPayload(draft)),
    },
  );
  const body = (await response.json().catch(() => null)) as SaveResponse | null;

  if (!response.ok || !body?.kit) {
    throw new Error(body?.message ?? "Não foi possível salvar o Kit.");
  }

  return body.kit;
}

export async function deleteKitDraft(kitId: number): Promise<AdminKitDeletion> {
  const response = await fetch(`/api/admin/kits/${kitId}`, { method: "DELETE" });
  const body = (await response.json().catch(() => null)) as
    | (AdminKitDeletion & { message?: string })
    | null;

  if (!response.ok || !body?.deleted) {
    throw new Error(body?.message ?? "Não foi possível excluir o Kit.");
  }

  return body;
}
