import type { AdminVendorDetail } from "@/lib/server/admin-vendors";

import { formatVendorDateTime } from "./vendor-detail-format";
import { DetailRow, DetailSection } from "./vendor-detail-primitives";

export function VendorDataTab({ vendor }: { vendor: AdminVendorDetail }) {
  const fullName = `${vendor.firstName} ${vendor.lastName}`.trim() || vendor.name;

  return (
    <div className="space-y-5">
      <DetailSection title="Responsável">
        <DetailRow label="Nome" value={fullName} />
        <DetailRow
          label="E-mail"
          value={vendor.email ? <a className="text-[#231f20] underline" href={`mailto:${vendor.email}`}>{vendor.email}</a> : null}
        />
        <DetailRow label="Telefone" value={vendor.phoneNumber} />
        <DetailRow label="CNPJ" value={vendor.cnpj} />
      </DetailSection>

      <DetailSection title="Loja">
        <DetailRow label="Nome da loja" value={vendor.storeName} />
        <DetailRow label="Instagram" value={vendor.instagram ? `@${vendor.instagram.replace(/^@/, "")}` : ""} />
        <DetailRow label="Como conheceu a Papelito" value={vendor.discoveryChannel} />
        <DetailRow
          label="Já vendia Papelito?"
          value={vendor.hasSoldPapelito === "sim" ? "Sim" : vendor.hasSoldPapelito === "nao" ? "Não" : vendor.hasSoldPapelito}
        />
      </DetailSection>

      <DetailSection title="Conta">
        <DetailRow label="Criada em" value={formatVendorDateTime(vendor.registeredAt)} />
        <DetailRow label="Papel atual" value="Vendor" />
      </DetailSection>
    </div>
  );
}
