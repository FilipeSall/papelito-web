"use client";

import { SpreadsheetDropzone, spreadsheetFileError } from "@/components/ui/spreadsheet-dropzone";
import {
  SKU_IMPORT_ACCEPT,
  SKU_IMPORT_MAX_BYTES,
} from "@/features/vendor-sku-import/types/vendor-sku-import";

/**
 * Motivo para recusar o arquivo antes do envio, ou `null` quando ele pode seguir.
 * É só experiência: o WordPress repete a validação e confere o conteúdo.
 */
export function skuImportFileError(file: File): string | null {
  return spreadsheetFileError(file, SKU_IMPORT_ACCEPT, SKU_IMPORT_MAX_BYTES);
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
 * Área de envio da planilha de códigos do vendor, sobre a `SpreadsheetDropzone` compartilhada.
 */
export function SkuImportDropzone({ disabled, file, onFile }: Readonly<SkuImportDropzoneProps>) {
  return (
    <SpreadsheetDropzone
      accept={SKU_IMPORT_ACCEPT}
      disabled={disabled}
      file={file}
      hint=".csv ou .xlsx de até 2 MB, com as colunas cod produto e descricao (subgrupo é opcional)."
      onFile={onFile}
      testId="sku-import-dropzone"
    />
  );
}
