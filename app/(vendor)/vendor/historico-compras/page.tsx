import { VendorEmptyState, VendorPageHeader } from "@/components/layout/vendor-panel";

export default function VendorPurchaseHistoryPage() {
  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Este espaco reunira compras de reposicao feitas com a Papelito quando o fluxo estiver disponivel."
        eyebrow="Reposicao"
        signal="em breve"
        title="Historico de compras"
      />
      <VendorEmptyState
        body="Em breve: historico das suas compras de reposicao com a Papelito."
        label="HST"
        title="Nenhuma compra para exibir"
      />
    </div>
  );
}
