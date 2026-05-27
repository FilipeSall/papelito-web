import type { AdminVendorDetail } from "@/lib/server/admin-vendors";

import { formatVendorCep } from "./vendor-detail-format";
import { DetailRow, DetailSection } from "./vendor-detail-primitives";

export function VendorCoverageTab({ vendor }: { vendor: AdminVendorDetail }) {
  const coverage = vendor.minCepRanges.map((min, index) => {
    const max = vendor.maxCepRanges[index] ?? "";
    return `${formatVendorCep(min)} → ${formatVendorCep(max)}`;
  });

  return (
    <DetailSection title="Cobertura regional">
      <DetailRow label="Cidade / Estado" value={`${vendor.city} / ${vendor.state}`.trim()} />
      <DetailRow label="CEP base" value={formatVendorCep(vendor.cep)} />
      <div className="sm:col-span-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
          Faixas atendidas
        </span>
        {coverage.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm font-mono text-[#231f20]">
            {coverage.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#231f20]/56">Sem faixas definidas.</p>
        )}
      </div>
    </DetailSection>
  );
}
