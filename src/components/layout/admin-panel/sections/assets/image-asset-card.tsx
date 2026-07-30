"use client";

import type { ManagedImageAsset, SiteImageAssetKey } from "@/types/home-assets";

import { INPUT_CLASS, LABEL_CLASS } from "./field-classes";
import { PreviewImage } from "./preview-image";
import { UploadButton } from "./upload-button";

export type ImageFieldConfig = {
  key: SiteImageAssetKey;
  title: string;
  eyebrow: string;
  description: string;
  formatHint: string;
  previewClass?: string;
};

export function ImageAssetCard({
  asset,
  config,
  isUploading,
  onAltChange,
  onFileSelect,
}: {
  asset: ManagedImageAsset;
  config: ImageFieldConfig;
  isUploading: boolean;
  onAltChange: (alt: string) => void;
  onFileSelect: (file: File) => void | Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-[#231f20]/12 bg-white p-4 shadow-[0_10px_24px_rgba(35,31,32,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a5f00]">
            {config.eyebrow}
          </p>
          <h4 className="mt-1 text-base font-semibold text-[#231f20]">{config.title}</h4>
          <p className="mt-1 text-sm leading-6 text-[#5e574c]">{config.description}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#6a5f00]">
            {config.formatHint}
          </p>
        </div>
        <UploadButton isUploading={isUploading} onFileSelect={onFileSelect} />
      </div>

      <PreviewImage
        className={config.previewClass}
        imageUrl={asset.imageUrl}
        label={config.title}
      />

      <div className="mt-4">
        <label className={LABEL_CLASS} htmlFor={`site-image-alt-${config.key}`}>
          Texto alternativo
        </label>
        <input
          className={INPUT_CLASS}
          id={`site-image-alt-${config.key}`}
          onChange={(event) => onAltChange(event.target.value)}
          type="text"
          value={asset.alt}
        />
      </div>
    </div>
  );
}
