"use client";

import { PreviewImage } from "./preview-image";
import { UploadButton } from "./upload-button";

export function UploadCard({
  formatHint,
  imageUrl,
  isUploading,
  label,
  onFileSelect,
  previewClass,
}: {
  formatHint: string;
  imageUrl: string;
  isUploading: boolean;
  label: string;
  onFileSelect: (file: File) => void | Promise<void>;
  previewClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#231f20]/12 bg-[#fffdf7] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6a5f00]">
            {label}
          </p>
          <p className="mt-1 text-sm text-[#5e574c]">{formatHint}</p>
        </div>
        <UploadButton isUploading={isUploading} onFileSelect={onFileSelect} />
      </div>

      <PreviewImage className={previewClass} imageUrl={imageUrl} label={label} />
    </div>
  );
}
