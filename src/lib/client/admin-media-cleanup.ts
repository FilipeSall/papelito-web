export async function deleteTemporaryAdminMedia(ids: Iterable<number>) {
  const mediaIds = Array.from(
    new Set(
      Array.from(ids).filter(
        (id): id is number => Number.isInteger(id) && id > 0,
      ),
    ),
  );

  if (mediaIds.length === 0) {
    return;
  }

  for (let index = 0; index < mediaIds.length; index += 50) {
    const response = await fetch("/api/admin/media", {
      body: JSON.stringify({ ids: mediaIds.slice(index, index + 50) }),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Não foi possível remover as imagens não utilizadas.");
    }
  }
}
