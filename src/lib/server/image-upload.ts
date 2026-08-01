import "server-only";

export const PRODUCT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export const PRODUCT_IMAGE_MIME_TYPES = [
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ProductImageMimeType = (typeof PRODUCT_IMAGE_MIME_TYPES)[number];

const ALLOWED_MIME_TYPES = new Set<string>(PRODUCT_IMAGE_MIME_TYPES);

const EXTENSION_BY_MIME_TYPE: Record<ProductImageMimeType, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MIME_TYPE_BY_EXTENSION: Record<string, ProductImageMimeType> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export type ImageUploadRejection =
  | { reason: "empty" }
  | { reason: "unreadable" }
  | { reason: "too_large"; limit: number; size: number }
  | { reason: "unknown_content" }
  | { reason: "format_not_supported"; detected: string }
  | { reason: "content_mismatch"; declared: string; detected: ProductImageMimeType }
  | { reason: "truncated"; detected: ProductImageMimeType };

export type ImageUploadValidation =
  | {
      bytes: Uint8Array;
      fileName: string;
      mimeType: ProductImageMimeType;
      ok: true;
      size: number;
    }
  | { ok: false; rejection: ImageUploadRejection };

function matchesSignature(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

function readAscii(bytes: Uint8Array, offset: number, length: number) {
  if (offset + length > bytes.byteLength) {
    return "";
  }

  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(bytes[offset + index] as number);
  }

  return value;
}

function readUint32LE(bytes: Uint8Array, offset: number) {
  return (
    (bytes[offset] as number) +
    ((bytes[offset + 1] as number) << 8) +
    ((bytes[offset + 2] as number) << 16) +
    (bytes[offset + 3] as number) * 0x1000000
  );
}

function readUint32BE(bytes: Uint8Array, offset: number) {
  return (
    (bytes[offset] as number) * 0x1000000 +
    ((bytes[offset + 1] as number) << 16) +
    ((bytes[offset + 2] as number) << 8) +
    (bytes[offset + 3] as number)
  );
}

function isAvifBrandList(bytes: Uint8Array) {
  if (readAscii(bytes, 4, 4) !== "ftyp") {
    return false;
  }

  const boxSize = Math.min(readUint32BE(bytes, 0), bytes.byteLength);

  for (let offset = 8; offset + 4 <= boxSize; offset += 4) {
    const brand = readAscii(bytes, offset, 4);

    if (brand === "avif" || brand === "avis") {
      return true;
    }
  }

  return false;
}

export function detectImageMimeType(bytes: Uint8Array): ProductImageMimeType | null {
  if (matchesSignature(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }

  if (matchesSignature(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  const gifSignature = readAscii(bytes, 0, 6);

  if (gifSignature === "GIF87a" || gifSignature === "GIF89a") {
    return "image/gif";
  }

  if (readAscii(bytes, 0, 4) === "RIFF" && readAscii(bytes, 8, 4) === "WEBP") {
    return "image/webp";
  }

  if (isAvifBrandList(bytes)) {
    return "image/avif";
  }

  return null;
}

function isTruncated(bytes: Uint8Array, mimeType: ProductImageMimeType) {
  if (mimeType === "image/webp") {
    return readUint32LE(bytes, 4) + 8 > bytes.byteLength;
  }

  if (mimeType === "image/png") {
    return readAscii(bytes, bytes.byteLength - 8, 4) !== "IEND";
  }

  if (mimeType === "image/jpeg") {
    for (let offset = bytes.byteLength - 2; offset > 2; offset -= 1) {
      if (bytes[offset] === 0xff && bytes[offset + 1] === 0xd9) {
        return false;
      }
    }

    return true;
  }

  return false;
}

function normalizeDeclaredMimeType(value: string) {
  const declared = value.trim().toLowerCase();

  return declared === "image/jpg" ? "image/jpeg" : declared;
}

export function fileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");

  return parts.length > 1 ? (parts.pop() as string) : "";
}

function safeFileName(fileName: string, mimeType: ProductImageMimeType) {
  const extension = EXTENSION_BY_MIME_TYPE[mimeType];
  const base = fileName
    .replace(/\.[^.]*$/, "")
    .replace(/[^\w\-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "produto"}.${extension}`;
}

export async function validateImageUpload(
  file: File,
  maxBytes = PRODUCT_IMAGE_MAX_BYTES,
): Promise<ImageUploadValidation> {
  if (file.size === 0) {
    return { ok: false, rejection: { reason: "empty" } };
  }

  if (file.size > maxBytes) {
    return { ok: false, rejection: { limit: maxBytes, reason: "too_large", size: file.size } };
  }

  let bytes: Uint8Array;

  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return { ok: false, rejection: { reason: "unreadable" } };
  }

  if (bytes.byteLength === 0) {
    return { ok: false, rejection: { reason: "empty" } };
  }

  const detected = detectImageMimeType(bytes);

  if (!detected) {
    return { ok: false, rejection: { reason: "unknown_content" } };
  }

  if (!ALLOWED_MIME_TYPES.has(detected)) {
    return { ok: false, rejection: { detected, reason: "format_not_supported" } };
  }

  const declared = normalizeDeclaredMimeType(file.type);

  if (ALLOWED_MIME_TYPES.has(declared) && declared !== detected) {
    return { ok: false, rejection: { declared, detected, reason: "content_mismatch" } };
  }

  const extension = fileExtension(file.name);
  const extensionMimeType = MIME_TYPE_BY_EXTENSION[extension];

  if (extensionMimeType && extensionMimeType !== detected) {
    return {
      ok: false,
      rejection: { declared: extensionMimeType, detected, reason: "content_mismatch" },
    };
  }

  if (isTruncated(bytes, detected)) {
    return { ok: false, rejection: { detected, reason: "truncated" } };
  }

  return {
    bytes,
    fileName: safeFileName(file.name, detected),
    mimeType: detected,
    ok: true,
    size: bytes.byteLength,
  };
}
