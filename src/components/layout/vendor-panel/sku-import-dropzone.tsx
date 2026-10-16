"use client";

import { useState, type DragEvent } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import {
  SKU_IMPORT_ACCEPT,
  SKU_IMPORT_MAX_BYTES,
} from "@/features/vendor-sku-import/types/vendor-sku-import";

const ACCEPTED_EXTENSIONS = SKU_IMPORT_ACCEPT.split(",");

/**
 * Motivo para recusar o arquivo antes do envio, ou `null` quando ele pode seguir.
 * É só experiência: o WordPress repete a validação e confere o conteúdo.
 */
export function skuImportFileError(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return "Formato não suportado. Envie uma planilha .csv ou .xlsx.";
  }
  if (file.size <= 0) return "O arquivo selecionado está vazio.";
  if (file.size > SKU_IMPORT_MAX_BYTES) return "A planilha excede o limite de 2 MB.";
  return null;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type SkuImportDropzoneProps = {
  /** Bloqueia a troca de arquivo enquanto a prévia é processada. */
  disabled: boolean;
  /** Arquivo escolhido, exibido com nome e tamanho. */
  file: File | null;
  /** Recebe o arquivo solto ou escolhido no explorador, ainda sem validação. */
  onFile: (file: File) => void;
};

/**
 * Área de envio da planilha: aceita arrastar e soltar ou o seletor do sistema.
 * O `input` continua no fluxo de foco; a área inteira é o rótulo dele.
 */
export function SkuImportDropzone({ disabled, file, onFile }: Readonly<SkuImportDropzoneProps>) {
  const [dragging, setDragging] = useState(false);

  function handleDrag(event: DragEvent<HTMLLabelElement>, active: boolean) {
    event.preventDefault();
    if (!disabled) setDragging(active);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped && !disabled) onFile(dropped);
  }

  const tone = dragging ? "bg-brand-yellow/45" : "bg-white hover:bg-brand-yellow/18";

  return (
    <label
      className={[
        "relative flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed border-[#1a1a1a] px-5 py-8 text-center transition has-focus-visible:ring-2 has-focus-visible:ring-[#1a1a1a] has-focus-visible:ring-offset-2",
        tone,
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
      data-testid="sku-import-dropzone"
      onDragEnter={(event) => handleDrag(event, true)}
      onDragLeave={(event) => handleDrag(event, false)}
      onDragOver={(event) => handleDrag(event, true)}
      onDrop={handleDrop}
    >
      <input
        accept={SKU_IMPORT_ACCEPT}
        aria-describedby="sku-import-dropzone-hint"
        className={["sr-only", FOCUS_RING].join(" ")}
        disabled={disabled}
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          if (chosen) onFile(chosen);
          event.target.value = "";
        }}
        type="file"
      />
      <SkuImportDropzoneContent file={file} />
    </label>
  );
}

function SkuImportDropzoneContent({ file }: Readonly<{ file: File | null }>) {
  if (file) {
    return (
      <>
        <FileSpreadsheet aria-hidden className="size-8 text-[#1a1a1a]" strokeWidth={2} />
        <span className="max-w-full truncate text-sm font-black text-[#1a1a1a]">{file.name}</span>
        <span className="text-xs text-[#231f20]/62" id="sku-import-dropzone-hint">
          {formatSize(file.size)} · clique ou solte outro arquivo para trocar
        </span>
      </>
    );
  }
  return (
    <>
      <UploadCloud aria-hidden className="size-8 text-[#1a1a1a]" strokeWidth={2} />
      <span className="text-sm font-black text-[#1a1a1a]">Arraste a planilha aqui ou clique para escolher</span>
      <span className="text-xs leading-5 text-[#231f20]/62" id="sku-import-dropzone-hint">
        .csv ou .xlsx de até 2 MB, com as colunas cod produto e descricao (subgrupo é opcional).
      </span>
    </>
  );
}
