"use client";

import { useMemo } from "react";

import { buildDescriptionHtml, parseDescriptionParagraphs } from "@/utils/html";

import { FieldLabel } from "./form-fields";

type LongDescriptionEditorProps = {
  onChange: (value: string) => void;
  value: string;
};

export function LongDescriptionEditor({ onChange, value }: LongDescriptionEditorProps) {
  const paragraphs = useMemo(() => parseDescriptionParagraphs(value), [value]);
  const textareaValue = paragraphs.join("\n");

  function updateParagraphs(nextValue: string) {
    onChange(buildDescriptionHtml(nextValue.split("\n")));
  }

  return (
    <div className="grid gap-2">
      <FieldLabel
        helpText="Campo agrupado por paragrafos. Cada linha deste editor vira um paragrafo separado no WordPress."
        label="Descrição Longa"
      />
      <div className="border border-[#c9bd96] bg-white focus-within:border-[#231f20] focus-within:ring-1 focus-within:ring-[#231f20]">
        <textarea
          className="min-h-44 w-full resize-y border-0 bg-white px-4 py-3 text-sm leading-6 text-[#231f20] outline-none placeholder:text-[#231f20]/36"
          onChange={(event) => updateParagraphs(event.target.value)}
          placeholder="Descreva os materiais, diferenciais e detalhes comerciais do produto."
          value={textareaValue}
        />
      </div>
    </div>
  );
}
