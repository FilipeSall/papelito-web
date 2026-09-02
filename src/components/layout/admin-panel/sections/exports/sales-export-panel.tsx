"use client";

import { ExportPanel } from "./export-panel";

export function SalesExportPanel({
  pageFrom,
  pageTo,
}: Readonly<{
  pageFrom: string;
  pageTo: string;
}>) {
  return (
    <ExportPanel
      anchorId="exportar-vendas"
      description="Pedidos com pagamento confirmado no intervalo, com cliente, contato, endereço de cobrança, forma de pagamento e total."
      endpoint="/api/admin/reports/sales/export"
      filenamePrefix="vendas"
      formatFieldName="sales-export-format"
      pageFrom={pageFrom}
      pageTo={pageTo}
      submitLabel="Exportar vendas"
      title="Exportar vendas"
    />
  );
}
