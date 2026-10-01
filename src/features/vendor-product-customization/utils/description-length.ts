/** Normaliza parágrafos como o editor e conta pontos Unicode, sem contar HTML ou entidades. */
export function getVendorDescriptionLength(text: string) {
  const normalized = text.replace(/\r\n?/g, "\n").split(/\n{2,}/).map((paragraph) => paragraph.replace(/^[\s\p{Z}\u0085]+|[\s\p{Z}\u0085]+$/gu, "")).filter(Boolean).join("\n\n");
  return Array.from(normalized).length;
}
