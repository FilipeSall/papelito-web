export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#039;/gi, "'");
}

export function parseDescriptionParagraphs(value: string) {
  const paragraphMatches = Array.from(value.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
  const rawParagraphs =
    paragraphMatches.length > 0
      ? paragraphMatches.map((match) => match[1] ?? "")
      : value
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean);

  const paragraphs = rawParagraphs.map((paragraph) =>
    decodeHtmlEntities(
      paragraph
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .trim(),
    ),
  );

  return paragraphs.length > 0 ? paragraphs : [""];
}

export function buildDescriptionHtml(paragraphs: string[]) {
  return paragraphs
    .map((paragraph) => {
      const lines = paragraph
        .split(/\n+/)
        .map((line) => escapeHtml(line.trim()))
        .filter(Boolean);

      return lines.length > 0 ? `<p>${lines.join("<br />\n")}</p>` : "<p></p>";
    })
    .join("\n");
}
