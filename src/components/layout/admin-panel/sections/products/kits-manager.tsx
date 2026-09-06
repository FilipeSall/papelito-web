"use client";

import type { AdminFlashSaleCandidate } from "@/lib/server/admin-flash-sale";
import type { AdminKit } from "@/lib/server/admin-kits";
import type { AdminMerchandise } from "@/lib/server/admin-merchandise";

import { KitEditorDialog } from "./kit-editor-dialog";
import { KitDeleteModal } from "./kit-delete-modal";
import { KitsList } from "./kits-list";
import { useKitsManager } from "./use-kits-manager";

type KitsManagerProps = Readonly<{
  initialFocusKitId?: number | null;
  initialIssue?: "shipping-dimensions" | null;
  initialKits: AdminKit[];
  initialMerchandise: AdminMerchandise[];
  initialProducts: AdminFlashSaleCandidate[];
}>;

export function KitsManager({
  initialFocusKitId = null,
  initialIssue = null,
  initialKits,
  initialMerchandise,
  initialProducts,
}: KitsManagerProps) {
  const manager = useKitsManager({
    initialFocusKitId,
    initialIssue,
    initialKits,
    initialMerchandise,
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
        editorNotice={manager.editorNotice}
        error={manager.error}
        filteredMerchandise={manager.filteredMerchandise}
        filteredProducts={manager.filteredProducts}
        initialProducts={initialProducts}
        merchandiseById={manager.merchandiseById}
        merchandiseForm={manager.merchandiseForm}
        merchandiseSearch={manager.merchandiseSearch}
        onAddProduct={manager.addProduct}
        onAttachMerchandise={manager.attachMerchandise}
        onDetachMerchandise={manager.detachMerchandise}
        onEditMerchandise={manager.openMerchandiseEdit}
        onMerchandiseSearchChange={manager.setMerchandiseSearch}
        onPatchDraft={manager.patchDraft}
        onRemoveProduct={manager.removeProduct}
        onRequestClose={manager.closeDraft}
        onSave={manager.save}
        onSearchChange={manager.setSearch}
        onSetMerchandiseQuantity={manager.setMerchandiseQuantity}
        onSetProductQuantity={manager.setProductQuantity}
        onUploadImage={manager.uploadImage}
        referenceCents={manager.referenceCents}
        saving={manager.saving}
        saveDisabled={manager.saving || manager.uploadingKitImage}
        search={manager.search}
        selectedProductIds={manager.selectedProductIds}
        uploadingKitImage={manager.uploadingKitImage}
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
