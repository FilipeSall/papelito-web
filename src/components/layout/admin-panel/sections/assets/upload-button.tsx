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
}: {
  accept?: string;
  disabled?: boolean;
  inputLabel?: string;
  isUploading: boolean;
  label?: string;
  onFileSelect: (file: File) => void | Promise<void>;
}) {
  return (
    <label className={SECONDARY_BUTTON_CLASS}>
      {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
      {label}
      <input
        accept={accept}
        aria-label={inputLabel}
        className="hidden"
        disabled={disabled || isUploading}
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
