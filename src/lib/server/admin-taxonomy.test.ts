import { beforeEach, describe, expect, it, vi } from "vitest";

const wpRestMock = vi.fn();

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

function wpFailure(code: string, message: string, status: number) {
  return {
    error: { code, data: { status }, message },
    ok: false as const,
    status,
  };
}

describe("mutações de taxonomia do admin", () => {
  beforeEach(() => {
    wpRestMock.mockReset();
  });

  it("preserva código, mensagem e status do WordPress ao atualizar subcategoria", async () => {
    wpRestMock.mockResolvedValue(
      wpFailure(
        "papelito_subcategory_slug_locked",
        "O slug não pode mudar enquanto houver produtos vinculados a esta subcategoria.",
        409,
      ),
    );
    const { updateSubcategory, WpTaxonomyError } = await import("./admin-taxonomy");

    await expect(updateSubcategory("token", 55, { name: "Bandeja M", slug: "bandeja-m" })).rejects.toEqual(
      expect.objectContaining({
        code: "papelito_subcategory_slug_locked",
        message: "O slug não pode mudar enquanto houver produtos vinculados a esta subcategoria.",
        status: 409,
      }),
    );
    await expect(updateSubcategory("token", 55, {})).rejects.toBeInstanceOf(WpTaxonomyError);
  });

  it("traduz a falha de subcategoria numa resposta 409 com o motivo real", async () => {
    wpRestMock.mockResolvedValue(
      wpFailure(
        "papelito_subcategory_in_use",
        "Remova os vínculos de produto antes de desativar a subcategoria.",
        409,
      ),
    );
    const { taxonomyErrorResponse, updateSubcategory } = await import("./admin-taxonomy");

    const error = await updateSubcategory("token", 55, { isActive: false }).catch(
      (caught: unknown) => caught,
    );

    expect(taxonomyErrorResponse(error, "Não foi possível salvar a subcategoria.")).toEqual({
      body: {
        code: "papelito_subcategory_in_use",
        message: "Remova os vínculos de produto antes de desativar a subcategoria.",
      },
      status: 409,
    });
  });

  it("preserva o motivo real também nas mutações de categoria", async () => {
    wpRestMock.mockResolvedValue(
      wpFailure("papelito_category_slug_taken", "Já existe uma categoria com esse slug.", 409),
    );
    const { taxonomyErrorResponse, updateCategory } = await import("./admin-taxonomy");

    const error = await updateCategory("token", 27, { slug: "piteiras" }).catch(
      (caught: unknown) => caught,
    );

    expect(taxonomyErrorResponse(error, "Não foi possível salvar a categoria.")).toEqual({
      body: {
        code: "papelito_category_slug_taken",
        message: "Já existe uma categoria com esse slug.",
      },
      status: 409,
    });
  });

  it("responde 404 quando a subcategoria não existe mais", async () => {
    wpRestMock.mockResolvedValue(
      wpFailure("papelito_subcategory_not_found", "Subcategoria não encontrada.", 404),
    );
    const { archiveSubcategory, taxonomyErrorResponse } = await import("./admin-taxonomy");

    const error = await archiveSubcategory("token", 999_999).catch((caught: unknown) => caught);

    expect(taxonomyErrorResponse(error, "Não foi possível arquivar a subcategoria.").status).toBe(404);
  });

  it("cai no fallback 500 quando o WordPress fica inalcançável", async () => {
    wpRestMock.mockResolvedValue({
      error: { code: "papelito_network_error", data: { status: 0 }, message: "fetch failed" },
      ok: false as const,
      status: 0,
    });
    const { taxonomyErrorResponse, updateSubcategory } = await import("./admin-taxonomy");

    const error = await updateSubcategory("token", 55, { name: "M" }).catch(
      (caught: unknown) => caught,
    );

    expect(taxonomyErrorResponse(error, "Não foi possível salvar a subcategoria.").status).toBe(500);
  });

  it("devolve a subcategoria salva quando o WordPress aceita a alteração", async () => {
    const saved = {
      archivedAt: null,
      categoryId: 30,
      description: "",
      facet: "tamanho",
      id: 55,
      isActive: true,
      name: "Bandeja M",
      productCount: 1,
      slug: "m",
      sortOrder: 6,
    };
    wpRestMock.mockResolvedValue({ data: saved, ok: true as const, status: 200 });
    const { updateSubcategory } = await import("./admin-taxonomy");

    await expect(updateSubcategory("token", 55, { name: "Bandeja M" })).resolves.toEqual(saved);
    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/admin/subcategories/55",
      expect.objectContaining({ json: { name: "Bandeja M" }, method: "PUT" }),
    );
  });
});
