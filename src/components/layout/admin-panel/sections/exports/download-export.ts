function filenameFromDisposition(disposition: string, fallback: string) {
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1] ?? fallback;
}

/**
 * Baixa a planilha da rota de exportação e devolve o nome com que o arquivo foi salvo — o do
 * `Content-Disposition` do servidor quando existe, senão o nome de reserva.
 */
export async function downloadExport(url: string, fallbackFilename: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Não foi possível gerar o arquivo.");
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  const filename = filenameFromDisposition(response.headers.get("content-disposition") ?? "", fallbackFilename);
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
  return filename;
}
