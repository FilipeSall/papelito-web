import { uploadDirectFile } from "@/lib/client/direct-upload";

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
  const json = await uploadDirectFile<UploadResponse>("media", file);

  if (!json.media) {
    throw new Error("Não foi possível enviar a imagem.");
  }

  return {
    alt: typeof json.media.alt === "string" ? json.media.alt : "",
    id: typeof json.media.id === "number" ? json.media.id : 0,
    src: typeof json.media.src === "string" ? json.media.src : "",
  };
}
