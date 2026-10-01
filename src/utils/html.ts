export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function decodeHtmlEntities(value: string) {
  return value
    .replaceAll(/&nbsp;/gi, " ")
    .replaceAll(/&amp;/gi, "&")
    .replaceAll(/&lt;/gi, "<")
    .replaceAll(/&gt;/gi, ">")
    .replaceAll(/&quot;/gi, "\"")
    .replaceAll(/&#039;/gi, "'");
}

function stripHtmlTags(value: string) {
  let result = "";
  let cursor = 0;

  while (cursor < value.length) {
    const tagStart = value.indexOf("<", cursor);

    if (tagStart === -1) {
      return result + value.slice(cursor);
    }

    const tagEnd = value.indexOf(">", tagStart + 1);

    if (tagEnd === -1) {
      return result + value.slice(cursor);
    }

    if (tagEnd === tagStart + 1) {
      result += value.slice(cursor, tagStart + 1);
      cursor = tagStart + 1;
      continue;
    }

    result += value.slice(cursor, tagStart);
    cursor = tagEnd + 1;
  }

  return result;
}

function removeTrailingSpacesBeforeNewlines(value: string) {
  const lines = value.split("\n");

  return lines
    .map((line, index) => {
      if (index === lines.length - 1) {
        return line;
      }

      let end = line.length;
      while (end > 0 && (line[end - 1] === " " || line[end - 1] === "\t")) {
        end -= 1;
      }

      return line.slice(0, end);
    })
    .join("\n");
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

  const paragraphs = rawParagraphs.map((paragraph) => {
    const cleaned = removeTrailingSpacesBeforeNewlines(
      stripHtmlTags(paragraph.replace(/<br\s*\/?>/gi, "\n")),
    );

    return decodeHtmlEntities(paragraphMatches.length > 0 ? cleaned : cleaned.trim());
  });

  return paragraphs.length > 0 ? paragraphs : [""];
}

export function buildDescriptionHtml(paragraphs: string[]) {
  return paragraphs
    .map((paragraph) => {
      const lines = paragraph
        .split(/\n+/)
        .map((line) => escapeHtml(line))
        .filter(Boolean);

      return lines.length > 0 ? `<p>${lines.join("<br />\n")}</p>` : "<p></p>";
    })
    .join("\n");
}

/**
 * Converte descrição de produto sem perder blocos ou texto fora de p.
 * Decodifica entidades depois de remover tags; saída é texto para nós React.
 */
export function parseProductDescriptionParagraphs(value: string) {
  const boundaries = value
    .replace(/<br\s*\/?>[ \t]*\r?\n?/gi, "\n")
    .replace(/<\/?(?:p|div|h[1-6]|li|ul|ol|blockquote|section|table|tr)\b[^>]*>/gi, "\n\n");
  const text = decodeHtmlEntities(stripHtmlTags(boundaries).replace(/&#(x[0-9a-f]+|\d+);/gi, (entity, raw: string) => {
    const hexadecimal = raw[0]?.toLowerCase() === "x";
    const point = Number.parseInt(hexadecimal ? raw.slice(1) : raw, hexadecimal ? 16 : 10);
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
      ? String.fromCodePoint(point)
      : entity;
  }));
  const paragraphs = removeTrailingSpacesBeforeNewlines(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return paragraphs.length > 0 ? paragraphs : [""];
}
