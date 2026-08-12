import Link from "next/link";

import type { CategoryIntegrityReport } from "@/lib/server/admin-taxonomy";

/**
 * O banco garante "no máximo uma categoria" pela chave primária. Este painel
 * mostra o que ele NÃO garante: produto publicado sem categoria, vínculo
 * apontando para termo que não existe mais, subcategoria de outra categoria.
 */
export function IntegrityPanel({ report }: { report: CategoryIntegrityReport | null }) {
  if (!report) {
    return (
      <p className="border-2 border-[#c0392b] bg-white px-4 py-3 text-sm font-semibold text-[#c0392b]">
        ⚠ Não foi possível carregar o relatório de integridade.
      </p>
    );
  }

  if (report.isClean) {
    return (
      <p className="border-2 border-[#1a1a1a] bg-white px-4 py-3 text-sm font-semibold text-[#1a1a1a]">
        ✓ Integridade da taxonomia sem pendências.
      </p>
    );
  }

  const rows: { detail: string; label: string }[] = [];

  if (report.publishedWithoutCategory.length > 0) {
    rows.push({
      detail: report.publishedWithoutCategory.join(", "),
      label: `${report.publishedWithoutCategory.length} produto(s) publicado(s) sem categoria`,
    });
  }

  if (report.danglingCategory.length > 0) {
    rows.push({
      detail: report.danglingCategory.join(", "),
      label: `${report.danglingCategory.length} vínculo(s) para categoria inexistente`,
    });
  }

  if (report.danglingSubcategory.length > 0) {
    rows.push({
      detail: report.danglingSubcategory.join(", "),
      label: `${report.danglingSubcategory.length} vínculo(s) para subcategoria inexistente`,
    });
  }

  if (report.crossCategorySubcategory.length > 0) {
    rows.push({
      detail: "reclassifique o produto",
      label: `${report.crossCategorySubcategory.length} subcategoria(s) de outra categoria`,
    });
  }

  if (report.inactiveWithProducts.length > 0) {
    rows.push({
      detail: report.inactiveWithProducts.map((item) => item.name).join(", "),
      label: `${report.inactiveWithProducts.length} categoria(s) inativa(s) com produto publicado`,
    });
  }

  if (report.unknownCollections.length > 0) {
    rows.push({
      detail: report.unknownCollections.join(", "),
      label: "coleção fora da lista curada",
    });
  }

  return (
    <section className="border-2 border-[#c0392b] bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rotate-45 bg-[#c0392b]" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#c0392b]">
          Integridade
        </h4>
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li className="text-sm text-[#231f20]" key={row.label}>
            <span className="font-black">⚠ {row.label}</span>
            <span className="ml-2 text-[#231f20]/65">— {row.detail}</span>
          </li>
        ))}
      </ul>
      <Link
        className="mt-4 inline-block border-2 border-[#1a1a1a] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow"
        href="/admin/products"
      >
        Ir para produtos
      </Link>
    </section>
  );
}
