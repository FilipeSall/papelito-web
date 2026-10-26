"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SpreadsheetDropzone, spreadsheetFileError } from "@/components/ui/spreadsheet-dropzone";
import { PRODUCT_IMPORT_ACCEPT, PRODUCT_IMPORT_MAX_BYTES } from "@/features/admin-product-import/types/admin-product-import";
import type { ReportOperation } from "@/types/admin-report-operations";

import { HardPanel, StatusChip } from "../../primitives";
import { pluralize } from "./export-report-config";
import { ProductImportGuide } from "./product-import-guide";
import { ProductImportWizard } from "./product-import-wizard";
import { operationStatus } from "./report-status";

const WHEN = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

/**
 * Entrada da importação de produtos: área de soltar a planilha, exemplo do arquivo aceito, modelo
 * CSV e o último lote.
 * Escolher um arquivo válido abre o assistente; ao fechar depois de um lote, a página se
 * atualiza para a Atividade recente e o último lote mostrarem o resultado.
 */
export function ProductImportPanel({ lastLot }: Readonly<{ lastLot: ReportOperation | null }>) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function choose(next: File) {
    const refusal = spreadsheetFileError(next, PRODUCT_IMPORT_ACCEPT, PRODUCT_IMPORT_MAX_BYTES);
    setError(refusal);
    setFile(refusal ? null : next);
  }

  function finish(imported: boolean) {
    setFile(null);
    if (imported) router.refresh();
  }

  return (
    <HardPanel accent="yellow" tone="dark">
      <div className="grid gap-4 px-5 py-6 md:px-6">
        <div className="flex items-center gap-2">
          <span aria-hidden className="inline-block size-3 rotate-45 bg-brand-yellow" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-yellow">Importar produtos</h2>
        </div>
        <p className="text-sm leading-6 text-[#f5f1e8]/86">
          Cadastra produtos <strong className="font-black text-white">novos</strong> no catálogo da Papelito, como rascunho. Produto que já existe não é
          alterado.
        </p>
        <SpreadsheetDropzone
          accept={PRODUCT_IMPORT_ACCEPT}
          disabled={file !== null}
          file={null}
          hint=".csv ou .xlsx de até 2 MB e 2.000 linhas, com nome, categoria e preco_regular."
          onFile={choose}
          testId="product-import-dropzone"
          tone="dark"
        />
        {error ? (
          <p className="text-sm font-bold text-[#ff8a7a]" role="alert">
            ⚠ {error}
          </p>
        ) : null}
        <ProductImportGuide />
        <LastLot lot={lastLot} />
      </div>
      {file ? <ProductImportWizard file={file} onClose={finish} /> : null}
    </HardPanel>
  );
}

function LastLot({ lot }: Readonly<{ lot: ReportOperation | null }>) {
  if (!lot) {
    return <p className="border-t-2 border-[#f5f1e8]/16 pt-4 text-sm text-[#f5f1e8]/70">Nenhum lote importado ainda.</p>;
  }
  return (
    <div className="grid gap-1.5 border-t-2 border-[#f5f1e8]/16 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f5f1e8]/60">
          Último lote · {lot.lot ?? "—"} · {WHEN.format(new Date(lot.at))}
        </p>
        <StatusChip compact {...operationStatus(lot.status)} />
      </div>
      <p className="font-semibold text-white">{lot.title}</p>
      <p className="font-(family-name:--font-admin-mono) text-[13px] text-[#f5f1e8]/78" data-numeric>
        {pluralize(lot.created, ["cadastrado", "cadastrados"])} · {pluralize(lot.ignored, ["ignorado", "ignorados"])} · {lot.errors} com erro
      </p>
    </div>
  );
}
