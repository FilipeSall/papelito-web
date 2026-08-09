"use client";

import { ImagePlus, LoaderCircle } from "lucide-react";

import { SECONDARY_BUTTON_CLASS } from "./field-classes";

export function UploadButton({
  accept = "image/*",
  disabled = false,
  inputLabel,
  isUploading,
  label = "Enviar",
  onFileSelect,
}: Readonly<{
  accept?: string;
  disabled?: boolean;
  inputLabel?: string;
  isUploading: boolean;
  label?: string;
  onFileSelect: (file: File) => void | Promise<void>;
}>) {
  const isBlocked = disabled || isUploading;

  return (
    <label
      className={`${SECONDARY_BUTTON_CLASS} shrink-0 ${
        isBlocked ? "pointer-events-none cursor-not-allowed opacity-60" : ""
      } focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1a1a1a]`}
    >
      {isUploading ? (
        <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
      ) : (
        <ImagePlus aria-hidden className="h-4 w-4" strokeWidth={2.2} />
      )}
      {isUploading ? "Enviando..." : label}
      <input
        accept={accept}
        aria-label={inputLabel}
        className="sr-only"
        disabled={isBlocked}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void onFileSelect(file);
          }
          event.target.value = "";
        }}
        type="file"
      />
    </label>
  );
}
