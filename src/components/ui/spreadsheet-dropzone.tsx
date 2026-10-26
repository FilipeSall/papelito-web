"use client";

import { useState, type DragEvent } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";

const FOCUS_WITHIN = "has-focus-visible:ring-2 has-focus-visible:ring-offset-2";

const TONES = {
  light: {
    frame: "border-[#1a1a1a] text-[#1a1a1a] has-focus-visible:ring-[#1a1a1a]",
    idle: "bg-white hover:bg-brand-yellow/18",
    dragging: "bg-brand-yellow/45",
    hint: "text-[#231f20]/62",
  },
  dark: {
    frame: "border-[#f5f1e8] text-[#f5f1e8] has-focus-visible:ring-brand-yellow has-focus-visible:ring-offset-[#1a1a1a]",
    idle: "bg-transparent hover:bg-brand-yellow/12",
    dragging: "bg-brand-yellow/22",
    hint: "text-[#f5f1e8]/72",
  },
} as const;

type SpreadsheetDropzoneProps = {
  /** Extensões aceitas pelo seletor do sistema, no formato do atributo `accept`. */
  accept: string;
  /** Bloqueia a troca de arquivo enquanto o anterior é processado. */
  disabled: boolean;
  /** Arquivo escolhido, exibido com nome e tamanho; `null` mostra o convite. */
  file: File | null;
  /** Linha de ajuda sob o convite: formato, tamanho e colunas esperadas. */
  hint: string;
  /** Recebe o arquivo solto ou escolhido, ainda sem validação. */
  onFile: (file: File) => void;
  /** `data-testid` da área, para os testes de quem usa. */
  testId?: string;
  /** `dark` para a área sobre painel escuro; o padrão é a chapa branca. */
  tone?: keyof typeof TONES;
};

/**
 * Motivo para recusar a planilha antes do envio, ou `null` quando ela pode seguir.
 * É só experiência: o WordPress repete a validação e confere o conteúdo.
 */
export function spreadsheetFileError(file: File, accept: string, maxBytes: number): string | null {
  const name = file.name.toLowerCase();
  if (!accept.split(",").some((extension) => name.endsWith(extension))) {
    return "Formato não suportado. Envie uma planilha .csv ou .xlsx.";
  }
  if (file.size <= 0) return "O arquivo selecionado está vazio.";
  if (file.size > maxBytes) return `A planilha excede o limite de ${Math.round(maxBytes / 1024 / 1024)} MB.`;
  return null;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Área de envio de planilha: aceita arrastar e soltar ou o seletor do sistema.
 * O `input` continua no fluxo de foco e a área inteira é o rótulo dele. Não valida o arquivo:
 * quem usa decide o que recusar antes do envio, e o WordPress repete a checagem.
 */
export function SpreadsheetDropzone({
  accept,
  disabled,
  file,
  hint,
  onFile,
  testId,
  tone = "light",
}: Readonly<SpreadsheetDropzoneProps>) {
  const [dragging, setDragging] = useState(false);
  const palette = TONES[tone];

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

  return (
    <label
      className={[
        "relative flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed px-5 py-8 text-center transition",
        FOCUS_WITHIN,
        palette.frame,
        dragging ? palette.dragging : palette.idle,
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
      data-testid={testId}
      onDragEnter={(event) => handleDrag(event, true)}
      onDragLeave={(event) => handleDrag(event, false)}
      onDragOver={(event) => handleDrag(event, true)}
      onDrop={handleDrop}
    >
      <input
        accept={accept}
        aria-describedby={testId ? `${testId}-hint` : undefined}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          if (chosen) onFile(chosen);
          event.target.value = "";
        }}
        type="file"
      />
      <SpreadsheetDropzoneContent file={file} hint={hint} hintClassName={palette.hint} hintId={testId ? `${testId}-hint` : undefined} />
    </label>
  );
}

type SpreadsheetDropzoneContentProps = {
  file: File | null;
  hint: string;
  hintClassName: string;
  hintId?: string;
};

function SpreadsheetDropzoneContent({ file, hint, hintClassName, hintId }: Readonly<SpreadsheetDropzoneContentProps>) {
  if (file) {
    return (
      <>
        <FileSpreadsheet aria-hidden className="size-8" strokeWidth={2} />
        <span className="max-w-full truncate text-sm font-black">{file.name}</span>
        <span className={`text-xs ${hintClassName}`} id={hintId}>
          {formatSize(file.size)} · clique ou solte outro arquivo para trocar
        </span>
      </>
    );
  }
  return (
    <>
      <UploadCloud aria-hidden className="size-8" strokeWidth={2} />
      <span className="text-sm font-black">Arraste a planilha aqui ou clique para escolher</span>
      <span className={`text-xs leading-5 ${hintClassName}`} id={hintId}>
        {hint}
      </span>
    </>
  );
}
