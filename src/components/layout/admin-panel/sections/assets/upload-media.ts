export const MEDIA_API = "/api/admin/assets/media";

type UploadResponse = {
  media?: {
    alt?: string;
    id?: number;
    src?: string;
  };
  message?: string;
};

export async function parseJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

export async function uploadMedia(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(MEDIA_API, {
    body: formData,
    method: "POST",
  });
  const json = await parseJson<UploadResponse>(response);

  if (!response.ok || !json?.media) {
    throw new Error(json?.message ?? "Não foi possível enviar a imagem.");
  }

  return {
    alt: typeof json.media.alt === "string" ? json.media.alt : "",
    id: typeof json.media.id === "number" ? json.media.id : 0,
    src: typeof json.media.src === "string" ? json.media.src : "",
  };
}
