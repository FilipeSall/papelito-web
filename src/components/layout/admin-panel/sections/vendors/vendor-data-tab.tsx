import type { AdminVendorDetail } from "@/lib/server/admin-vendors";

import { formatVendorDateTime } from "./vendor-detail-format";
import { DetailRow, DetailSection } from "./vendor-detail-primitives";

export function VendorDataTab({
  status,
  vendor,
}: {
  status: "pending" | "incomplete" | "approved" | "rejected" | "none";
  vendor: AdminVendorDetail;
}) {
  const fullName = `${vendor.firstName} ${vendor.lastName}`.trim() || vendor.name;

  return (
    <div className="space-y-5">
      <DetailSection title="Responsavel">
        <DetailRow label="Nome" value={fullName} />
        <DetailRow
          label="Email"
          value={
            vendor.email ? (
              <a href={`mailto:${vendor.email}`} className="text-[#231f20] underline">
                {vendor.email}
              </a>
            ) : null
          }
        />
        <DetailRow label="Telefone" value={vendor.phoneNumber} />
        <DetailRow label="CNPJ" value={vendor.cnpj} />
      </DetailSection>

      <DetailSection title="Loja">
        <DetailRow label="Nome da loja" value={vendor.storeName} />
        <DetailRow
          label="Instagram"
          value={vendor.instagram ? `@${vendor.instagram.replace(/^@/, "")}` : ""}
        />
        <DetailRow label="Como conheceu a Papelito" value={vendor.discoveryChannel} />
        <DetailRow
          label="Ja vendia Papelito?"
          value={
            vendor.hasSoldPapelito === "sim"
              ? "Sim"
              : vendor.hasSoldPapelito === "nao"
                ? "Nao"
                : vendor.hasSoldPapelito
          }
        />
      </DetailSection>

      <DetailSection title="Triagem">
        <DetailRow label="Enviada em" value={formatVendorDateTime(vendor.submittedAt)} />
        <DetailRow
          label="Decisao em"
          value={vendor.reviewedAt ? formatVendorDateTime(vendor.reviewedAt) : ""}
        />
        <DetailRow label="Decidida por" value={vendor.reviewedBy?.name} />
        {status === "incomplete" ? (
          <div className="sm:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              Regra de venda
            </span>
            <p className="mt-2 rounded-xl border border-[#d6b06b] bg-[#fff8ea] px-3 py-2 text-sm leading-6 text-[#7a4d12]">
              Este vendor pode acessar o painel para concluir o cadastro, mas permanece bloqueado
              para vender ate preencher todos os campos obrigatorios.
            </p>
          </div>
        ) : null}
        {status === "rejected" && vendor.rejectionReason ? (
          <div className="sm:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              Motivo da recusa
            </span>
            <p className="mt-2 rounded-xl border border-[#d7b0aa] bg-[#fef3f1] px-3 py-2 text-sm leading-6 text-[#7a3428]">
              {vendor.rejectionReason}
            </p>
          </div>
        ) : null}
      </DetailSection>
    </div>
  );
}
