"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import type { ManagedImageAsset, SiteImageAssetKey } from "@/types/home-assets";

import {
  CARD_CLASS,
  CARD_HEADER_CLASS,
  HINT_CLASS,
  ICON_BUTTON_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  MUTED_TEXT_CLASS,
} from "./field-classes";
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
  const [isOpen, setIsOpen] = useState(false);
  const regionId = useId();

  return (
    <article className={CARD_CLASS}>
      <header className={`flex items-center justify-between gap-3 ${CARD_HEADER_CLASS}`}>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
            {config.eyebrow}
          </p>
          <h4 className="mt-1.5 text-base font-black uppercase tracking-tight text-[#1a1a1a]">
            {config.title}
          </h4>
        </div>
        <button
          aria-controls={regionId}
          aria-expanded={isOpen}
          aria-label={isOpen ? `Recolher ${config.title}` : `Expandir ${config.title}`}
          className={ICON_BUTTON_CLASS}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </header>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div
          aria-label={`Editor de ${config.title}`}
          className="overflow-hidden"
          id={regionId}
          inert={!isOpen}
          role="region"
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={MUTED_TEXT_CLASS}>{config.description}</p>
                <p className={`mt-2 ${HINT_CLASS}`}>{config.formatHint}</p>
              </div>
              <UploadButton isUploading={isUploading} onFileSelect={onFileSelect} />
            </div>

            <PreviewImage className={config.previewClass} imageUrl={asset.imageUrl} label={config.title} />

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
        </div>
      </div>
    </article>
  );
}
