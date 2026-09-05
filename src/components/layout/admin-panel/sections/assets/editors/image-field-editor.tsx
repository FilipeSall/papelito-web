"use client";

import { HINT_CLASS, INPUT_CLASS, LABEL_CLASS, MUTED_TEXT_CLASS } from "../field-classes";
import { PreviewImage } from "../preview-image";
import { UploadButton } from "../upload-button";

export function ImageFieldEditor({
  accept,
  alt,
  altPlaceholder,
  description,
  fieldId,
  formatHint,
  imageUrl,
  isUploading,
  label,
  onAltChange,
  onFileSelect,
  previewClass,
  previewFrameClass,
  previewTone = "light",
  uploadLabel,
}: {
  accept?: string;
  alt: string;
  altPlaceholder?: string;
  description: string;
  fieldId: string;
  formatHint: string;
  imageUrl: string;
  isUploading: boolean;
  label: string;
  onAltChange: (alt: string) => void;
  onFileSelect: (file: File) => void | Promise<void>;
  previewClass?: string;
  previewFrameClass?: string;
  previewTone?: "dark" | "light";
  uploadLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={MUTED_TEXT_CLASS}>{description}</p>
          <p className={`mt-2 ${HINT_CLASS}`}>{formatHint}</p>
        </div>
        <UploadButton
          accept={accept}
          inputLabel={uploadLabel}
          isUploading={isUploading}
          onFileSelect={onFileSelect}
        />
      </div>

      <PreviewImage
        className={previewClass}
        frameClass={previewFrameClass}
        imageUrl={imageUrl}
        label={label}
        tone={previewTone}
      />

      <div>
        <label className={LABEL_CLASS} htmlFor={fieldId}>
          Texto alternativo *
        </label>
        <input
          className={INPUT_CLASS}
          id={fieldId}
          onChange={(event) => onAltChange(event.target.value)}
          placeholder={altPlaceholder}
          type="text"
          value={alt}
        />
        <p className="mt-2 text-sm leading-6 text-[#231f20]/64">
          Descreve a imagem para leitor de tela. Sem ele o WordPress recusa o salvamento.
        </p>
      </div>
    </div>
  );
}
