"use client";

import type { PartnerBannerConfig } from "@/types/home-assets";

import { INPUT_CLASS, LABEL_CLASS, TEXTAREA_CLASS } from "../field-classes";
import { UploadCard } from "../upload-card";

export function PartnerBannerEditor({
  banner,
  onChange,
  onFileSelect,
  uploadingKey,
}: {
  banner: PartnerBannerConfig;
  onChange: (patch: Partial<PartnerBannerConfig>) => void;
  onFileSelect: (field: "desktop" | "mobile", file: File) => void | Promise<void>;
  uploadingKey: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <UploadCard
          formatHint="Desktop: foto horizontal, aproximadamente 5:3."
          imageUrl={banner.desktopImageUrl}
          isUploading={uploadingKey === "partner:desktop"}
          label="Imagem desktop"
          onFileSelect={(file) => onFileSelect("desktop", file)}
        />
        <UploadCard
          formatHint="Mobile: foto vertical 2:3."
          imageUrl={banner.mobileImageUrl}
          isUploading={uploadingKey === "partner:mobile"}
          label="Imagem mobile"
          onFileSelect={(file) => onFileSelect("mobile", file)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className={LABEL_CLASS} htmlFor="partner-alt">
            Texto alternativo *
          </label>
          <input
            className={INPUT_CLASS}
            id="partner-alt"
            onChange={(event) => onChange({ alt: event.target.value })}
            placeholder="Parceiros no espaco PDV Perfeito"
            type="text"
            value={banner.alt}
          />
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="partner-href">
            Link interno do botão
          </label>
          <input
            className={INPUT_CLASS}
            id="partner-href"
            onChange={(event) => onChange({ href: event.target.value })}
            placeholder="/revendedor"
            type="text"
            value={banner.href}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className={LABEL_CLASS} htmlFor="partner-tag">
            Texto pequeno
          </label>
          <input
            className={INPUT_CLASS}
            id="partner-tag"
            onChange={(event) => onChange({ tag: event.target.value })}
            placeholder="Seja um parceiro"
            type="text"
            value={banner.tag}
          />
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="partner-cta">
            Texto do botão
          </label>
          <input
            className={INPUT_CLASS}
            id="partner-cta"
            onChange={(event) => onChange({ ctaLabel: event.target.value })}
            placeholder="Quero ser um parceiro"
            type="text"
            value={banner.ctaLabel}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="partner-description">
          Descrição
        </label>
        <textarea
          className={TEXTAREA_CLASS}
          id="partner-description"
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Copy principal do bloco PDV Perfeito."
          value={banner.description}
        />
      </div>
    </div>
  );
}
