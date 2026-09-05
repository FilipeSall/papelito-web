"use client";

import type { HeroBanner } from "@/types/home-assets";

import { INPUT_CLASS, LABEL_CLASS } from "../field-classes";
import { UploadCard } from "../upload-card";

export function HeroBannerEditor({
  banner,
  onChange,
  onFileSelect,
  uploadingKey,
}: {
  banner: HeroBanner;
  onChange: (patch: Partial<HeroBanner>) => void;
  onFileSelect: (field: "desktop" | "mobile", file: File) => void | Promise<void>;
  uploadingKey: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <UploadCard
          formatHint="Desktop: banner largo 16:5."
          imageUrl={banner.desktopImageUrl}
          isUploading={uploadingKey === `hero:${banner.id}:desktop`}
          label="Imagem desktop"
          onFileSelect={(file) => onFileSelect("desktop", file)}
        />
        <UploadCard
          formatHint="Mobile: arte vertical 1:2."
          imageUrl={banner.mobileImageUrl}
          isUploading={uploadingKey === `hero:${banner.id}:mobile`}
          label="Imagem mobile"
          onFileSelect={(file) => onFileSelect("mobile", file)}
          previewClass="object-contain object-top"
        />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor={`hero-alt-${banner.id}`}>
          Texto alternativo *
        </label>
        <input
          className={INPUT_CLASS}
          id={`hero-alt-${banner.id}`}
          onChange={(event) => onChange({ alt: event.target.value })}
          placeholder="Ex: Banner de piteiras Papelito"
          type="text"
          value={banner.alt}
        />
        <p className="mt-2 text-sm leading-6 text-[#231f20]/64">
          As duas imagens e o texto alternativo são obrigatórios para publicar a opção.
        </p>
      </div>
    </div>
  );
}
