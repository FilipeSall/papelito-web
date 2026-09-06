"use client";

import type { AdminMerchandise } from "@/lib/server/admin-merchandise";

import { MerchandiseDeleteModal } from "./merchandise-delete-modal";
import { MerchandiseFormDialog } from "./merchandise-form-dialog";
import { MerchandiseList } from "./merchandise-list";
import { useMerchandiseManager } from "./use-merchandise-manager";

export function MerchandiseManager({
  initialMerchandise,
}: Readonly<{ initialMerchandise: AdminMerchandise[] }>) {
  const manager = useMerchandiseManager(initialMerchandise);
  const editingId = manager.form.draft?.id;
  const editing = editingId
    ? manager.merchandise.find((item) => item.id === editingId)
    : undefined;

  return (
    <>
      <MerchandiseList
        deletingId={manager.deletingId}
        error={manager.deleteTarget ? "" : manager.error}
        merchandise={manager.filtered}
        notice={manager.notice}
        onCreate={manager.form.openCreate}
        onDelete={manager.requestDelete}
        onEdit={manager.form.openEdit}
        onSearchChange={manager.setSearch}
        search={manager.search}
        total={manager.total}
      />
      <MerchandiseFormDialog
        controller={manager.form}
        usedByKits={editing?.kits ?? []}
      />
      {manager.deleteTarget ? (
        <MerchandiseDeleteModal
          blockingKits={manager.blockingKits}
          deleting={manager.deletingId === manager.deleteTarget.id}
          error={manager.error}
          merchandise={manager.deleteTarget}
          onCancel={manager.cancelDelete}
          onConfirm={() => void manager.confirmDelete()}
        />
      ) : null}
    </>
  );
}
