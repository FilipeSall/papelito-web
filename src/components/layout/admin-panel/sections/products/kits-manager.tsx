"use client";

import type { AdminFlashSaleCandidate } from "@/lib/server/admin-flash-sale";
import type { AdminKit } from "@/lib/server/admin-kits";

import { KitEditorDialog } from "./kit-editor-dialog";
import { KitDeleteModal } from "./kit-delete-modal";
import { KitsList } from "./kits-list";
import { useKitsManager } from "./use-kits-manager";

type KitsManagerProps = Readonly<{
  initialFocusKitId?: number | null;
  initialIssue?: "shipping-dimensions" | null;
  initialKits: AdminKit[];
  initialProducts: AdminFlashSaleCandidate[];
}>;

export function KitsManager({
  initialFocusKitId = null,
  initialIssue = null,
  initialKits,
  initialProducts,
}: KitsManagerProps) {
  const manager = useKitsManager({
    initialFocusKitId,
    initialIssue,
    initialKits,
    initialProducts,
  });

  return (
    <>
      <KitsList
        kits={manager.kits}
        onCreate={manager.openCreate}
        onDelete={manager.requestDelete}
        onEdit={manager.openEdit}
        deletingKitId={manager.deletingKitId}
        error={manager.draft || manager.deleteTarget ? "" : manager.error}
        notice={manager.notice}
      />
      <KitEditorDialog
        draft={manager.draft}
        error={manager.error}
        filteredProducts={manager.filteredProducts}
        initialProducts={initialProducts}
        onAddMerchandise={manager.addMerchandise}
        onAddProduct={manager.addProduct}
        onPatchDraft={manager.patchDraft}
        onPatchMerchandise={manager.patchMerchandise}
        onRemoveMerchandise={manager.removeMerchandise}
        onRemoveProduct={manager.removeProduct}
        onRequestClose={manager.closeDraft}
        onSave={manager.save}
        onSearchChange={manager.setSearch}
        onSetProductQuantity={manager.setProductQuantity}
        onUploadImage={manager.uploadImage}
        referenceCents={manager.referenceCents}
        saving={manager.saving}
        saveDisabled={manager.saving || manager.uploadingTargets.length > 0}
        search={manager.search}
        selectedProductIds={manager.selectedProductIds}
        uploadingTargets={manager.uploadingTargets}
        uploadNotice={manager.uploadNotice}
      />
      {manager.deleteTarget ? (
        <KitDeleteModal
          deleting={manager.deletingKitId === manager.deleteTarget.id}
          error={manager.error}
          kit={manager.deleteTarget}
          onCancel={manager.cancelDelete}
          onConfirm={manager.confirmDelete}
        />
      ) : null}
    </>
  );
}
