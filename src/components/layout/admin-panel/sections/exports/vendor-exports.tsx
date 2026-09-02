"use client";

import { ExportPanel } from "./export-panel";

export function VendorSalesExportPanel({
  pageFrom,
  pageTo,
}: Readonly<{
  pageFrom: string;
  pageTo: string;
}>) {
  return (
    <ExportPanel
      anchorId="exportar-minhas-vendas"
      description="Somente os pedidos atendidos pela sua operação, com pagamento confirmado no intervalo. O recorte por vendor é aplicado no servidor."
      endpoint="/api/vendor/reports/sales/export"
      filenamePrefix="minhas-vendas"
      formatFieldName="vendor-sales-export-format"
      pageFrom={pageFrom}
      pageTo={pageTo}
      submitLabel="Exportar vendas"
      title="Exportar minhas vendas"
    />
  );
}

export function VendorCustomersExportPanel({
  pageFrom,
  pageTo,
}: Readonly<{
  pageFrom: string;
  pageTo: string;
}>) {
  return (
    <ExportPanel
      anchorId="exportar-meus-clientes"
      description="Somente as contas que compraram da sua operação no intervalo, sem repetição. Contém dado de cliente, não de pedido."
      endpoint="/api/vendor/reports/customers/export"
      filenamePrefix="meus-clientes"
      formatFieldName="vendor-customers-export-format"
      pageFrom={pageFrom}
      pageTo={pageTo}
      submitLabel="Exportar clientes"
      title="Exportar meus clientes"
    />
  );
}
