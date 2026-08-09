"use client";

import { HINT_CLASS, SUBPANEL_CLASS } from "./field-classes";
import { PreviewImage } from "./preview-image";
import { UploadButton } from "./upload-button";

export function UploadCard({
  formatHint,
  imageUrl,
  isUploading,
  label,
  onFileSelect,
  previewClass,
}: Readonly<{
  formatHint: string;
  imageUrl: string;
  isUploading: boolean;
  label: string;
  onFileSelect: (file: File) => void | Promise<void>;
  previewClass?: string;
}>) {
  return (
    <div className={SUBPANEL_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
            {label}
          </p>
          <p className={`mt-2 ${HINT_CLASS}`}>{formatHint}</p>
        </div>
        <UploadButton isUploading={isUploading} onFileSelect={onFileSelect} />
      </div>

      <PreviewImage className={previewClass} imageUrl={imageUrl} label={label} />
    </div>
  );
}
