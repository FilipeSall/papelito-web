"use client";

import type { AdminFlashSaleCandidate } from "@/lib/server/admin-flash-sale";
import type { AdminKit } from "@/lib/server/admin-kits";

import { KitEditorDialog } from "./kit-editor-dialog";
import { KitsList } from "./kits-list";
import { useKitsManager } from "./use-kits-manager";

type KitsManagerProps = Readonly<{
  initialKits: AdminKit[];
  initialProducts: AdminFlashSaleCandidate[];
}>;

export function KitsManager({
  initialKits,
  initialProducts,
}: KitsManagerProps) {
  const manager = useKitsManager({ initialKits, initialProducts });

  return (
    <>
      <KitsList
        kits={manager.kits}
        onCreate={manager.openCreate}
        onEdit={manager.openEdit}
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
        search={manager.search}
        selectedProductIds={manager.selectedProductIds}
        uploadingTargets={manager.uploadingTargets}
        uploadNotice={manager.uploadNotice}
      />
    </>
  );
}
