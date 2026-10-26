"use client";

import { useState } from "react";
import { Asterisk, FileDown, Minus, TableProperties, Truck, X } from "lucide-react";

import { BaseModal } from "@/components/ui/base-modal";
import {
  PRODUCT_IMPORT_EXAMPLE_ROWS,
  PRODUCT_IMPORT_SYNONYMS,
  PRODUCT_IMPORT_TEMPLATE_COLUMNS,
  type ProductImportTemplateColumn,
} from "@/features/admin-product-import/types/admin-product-import";
import { downloadCsv, productImportTemplateCsv } from "@/features/admin-product-import/utils/product-import-decisions";

import { FOCUS_RING, PrimaryButton, StatusChip, type StatusShape } from "../../primitives";

const REQUIREMENT: Record<ProductImportTemplateColumn["requirement"], StatusShape> = {
  frete: { icon: Truck, label: "Para cotar frete", tone: "pending" },
  obrigatoria: { icon: Asterisk, label: "Obrigatória", tone: "positive" },
  opcional: { icon: Minus, label: "Opcional", tone: "neutral" },
};

const TRIGGER =
  "inline-flex min-h-10 items-center gap-2 border-2 border-[#f5f1e8] px-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#f5f1e8] transition-colors hover:bg-[#f5f1e8] hover:text-[#1a1a1a]";

function downloadTemplate() {
  downloadCsv("modelo-importacao-produtos.csv", productImportTemplateCsv());
}

/**
 * Exemplo do arquivo que a importação aceita: a planilha de exemplo como ela é, o que cada
 * coluna espera e as palavras que a importação lê como a mesma coisa. O download é o mesmo modelo.
 */
export function ProductImportGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        <button className={[TRIGGER, FOCUS_RING].join(" ")} onClick={() => setOpen(true)} type="button">
          <TableProperties aria-hidden className="size-4" strokeWidth={2.4} />
          Ver exemplo e colunas
        </button>
        <button className={[TRIGGER, FOCUS_RING].join(" ")} onClick={downloadTemplate} type="button">
          <FileDown aria-hidden className="size-4" strokeWidth={2.4} />
          Baixar modelo CSV
        </button>
      </div>
      <BaseModal ariaLabelledBy="product-import-guide-title" contentClassName="max-w-5xl" onClose={() => setOpen(false)} open={open}>
        <div className="flex max-h-[calc(100dvh-3rem)] flex-col border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
          <div aria-hidden className="h-2 shrink-0 bg-brand-yellow" />
          <header className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-[#1a1a1a] px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">Relatórios · Importar produtos</p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#1a1a1a]" id="product-import-guide-title">
                Como montar a planilha
              </h2>
            </div>
            <button aria-label="Fechar" className={["grid size-11 shrink-0 place-items-center border-2 border-[#1a1a1a] bg-white hover:bg-[#1a1a1a] hover:text-white", FOCUS_RING].join(" ")} onClick={() => setOpen(false)} type="button">
              <X aria-hidden className="size-4" strokeWidth={2.4} />
            </button>
          </header>
          <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto px-5 py-5">
            <GuideRules />
            <ExampleSheet />
            <ColumnsTable />
            <Synonyms />
          </div>
          <footer className="flex shrink-0 flex-wrap justify-end gap-2.5 border-t-2 border-[#1a1a1a] bg-[#f7f2e7] px-5 py-3.5">
            <PrimaryButton onClick={downloadTemplate}>
              <FileDown aria-hidden className="size-4" strokeWidth={2.4} />
              Baixar este exemplo
            </PrimaryButton>
          </footer>
        </div>
      </BaseModal>
    </>
  );
}

function GuideHeading({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span aria-hidden className="inline-block size-3 rotate-45 bg-brand-yellow" />
      <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">{children}</h3>
    </div>
  );
}

function GuideRules() {
  return (
    <section>
      <GuideHeading>O arquivo</GuideHeading>
      <ul className="grid gap-1 pl-5 text-sm leading-6 text-[#1a1a1a] marker:text-[#1a1a1a]/40 [list-style:square]">
        <li>.csv (separado por ponto e vírgula ou vírgula) ou .xlsx, primeira aba; até 2 MB e 2.000 produtos.</li>
        <li>Primeira linha com os cabeçalhos, em qualquer ordem; acento e maiúscula não importam.</li>
        <li>
          Obrigatórias: <strong className="font-black">nome</strong>, <strong className="font-black">categoria</strong> e{" "}
          <strong className="font-black">preco_regular</strong>. Coluna que não está no modelo é ignorada.
        </li>
        <li>Preço e medida aceitam vírgula ou ponto (84,90 ou 84.90). Listas separam itens com |.</li>
        <li>Todo produto entra como rascunho, sem imagem. O SKU é gerado no cadastro.</li>
        <li>A exportação de Produtos sai neste mesmo formato e serve de ponto de partida.</li>
      </ul>
    </section>
  );
}

function ExampleSheet() {
  const required = new Set(PRODUCT_IMPORT_TEMPLATE_COLUMNS.filter((column) => column.requirement === "obrigatoria").map((column) => column.key));
  return (
    <section>
      <GuideHeading>Exemplo aceito</GuideHeading>
      <div className="overflow-x-auto border-2 border-[#1a1a1a] bg-white">
        <table className="w-full border-collapse font-(family-name:--font-admin-mono) text-xs">
          <thead>
            <tr>
              {PRODUCT_IMPORT_TEMPLATE_COLUMNS.map((column) => (
                <th
                  className={["whitespace-nowrap border-b-2 border-r border-[#1a1a1a] px-2.5 py-2 text-left font-semibold", required.has(column.key) ? "bg-brand-yellow text-[#1a1a1a]" : "bg-[#1a1a1a] text-[#f5f1e8]"].join(" ")}
                  key={column.key}
                  scope="col"
                >
                  {column.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRODUCT_IMPORT_EXAMPLE_ROWS.map((row) => (
              <tr className="border-b border-[#1a1a1a]/10" key={row[0]}>
                {row.map((cell, index) => (
                  <td className="whitespace-nowrap border-r border-[#1a1a1a]/10 px-2.5 py-2 text-[#1a1a1a]" key={`${row[0]}-${PRODUCT_IMPORT_TEMPLATE_COLUMNS[index]?.key ?? index}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[#231f20]/66">Em amarelo, as colunas obrigatórias.</p>
    </section>
  );
}

function ColumnsTable() {
  return (
    <section>
      <GuideHeading>O que cada coluna espera</GuideHeading>
      <div className="overflow-x-auto border-2 border-[#1a1a1a] bg-white">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {PRODUCT_IMPORT_TEMPLATE_COLUMNS.map((column) => (
              <tr className="border-b-2 border-[#1a1a1a]/10 align-top" key={column.key}>
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-(family-name:--font-admin-mono) text-xs font-semibold text-[#1a1a1a]" scope="row">
                  {column.key}
                </th>
                <td className="px-3 py-2.5">
                  <StatusChip className="whitespace-nowrap" compact {...REQUIREMENT[column.requirement]} />
                </td>
                <td className="px-3 py-2.5 text-[#231f20]/78">{column.rule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Synonyms() {
  return (
    <section>
      <GuideHeading>Palavras que a importação entende</GuideHeading>
      <p className="mb-2.5 text-sm leading-6 text-[#231f20]/72">
        As mesmas da importação de códigos do vendor. A linha entra normalmente e ganha uma nota dizendo como foi lida.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {PRODUCT_IMPORT_SYNONYMS.map((group) => (
          <div className="border-2 border-[#1a1a1a] bg-white px-4 py-3" key={group.where}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">{group.where}</p>
            <dl className="mt-2 grid gap-2 text-sm leading-5">
              {group.examples.map((example) => (
                <div key={example.written}>
                  <dt className="font-(family-name:--font-admin-mono) text-xs font-semibold text-[#1a1a1a]">{example.written}</dt>
                  <dd className="text-[#231f20]/72">→ {example.read}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
