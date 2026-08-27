import type { AdminKit } from "@/lib/server/admin-kits";

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
