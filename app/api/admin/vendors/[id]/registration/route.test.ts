import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminApiSessionMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("@/lib/server/admin-api-auth", () => ({
  getAdminApiSession: () => getAdminApiSessionMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

import { GET, PUT } from "./route";

const APPLICATION = {
  coverageRanges: [{ minCep: "01000-000", maxCep: "02000-000" }],
  step1: { cnpj: "65.326.368/0001-90", email: "ana@example.com", storeName: "Papelaria Ana" },
  step2: { city: "São Paulo", state: "SP", street: "Avenida Paulista" },
};
const DRAFT = { companyName: "Papelaria Ana LTDA" };

function request(body: unknown, id = "42") {
  return new Request(`http://localhost/api/admin/vendors/${id}/registration`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
}

function context(id = "42") {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/admin/vendors/[id]/registration", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    wpRestMock.mockReset();
  });

  it("reads the editable representation as the signed-in administrator", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    wpRestMock.mockResolvedValue({
      data: { application: APPLICATION, draft: DRAFT, pendingFields: [] },
      ok: true,
      status: 200,
    });

    const response = await GET(new Request("http://localhost"), context());

    expect(wpRestMock).toHaveBeenCalledWith("/papelito/v1/admin/vendors/42/registration", {
      headers: { Authorization: "Bearer admin-token" },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      registration: { draft: DRAFT, pendingFields: [] },
    });
  });

  it("refuses a session that is not an administrator", async () => {
    getAdminApiSessionMock.mockResolvedValue({ error: "Acesso negado.", status: 403 });

    const response = await GET(new Request("http://localhost"), context());

    expect(response.status).toBe(403);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("never coerces a partially numeric id into a real vendor", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });

    const response = await GET(new Request("http://localhost"), context("42abc"));

    expect(response.status).toBe(400);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("surfaces a non-vendor account as a 404 instead of an empty form", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    wpRestMock.mockResolvedValue({
      error: { code: "papelito_vendor_not_found", message: "Vendor nao encontrado." },
      ok: false,
      status: 404,
    });

    const response = await GET(new Request("http://localhost"), context("77"));

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ message: "Vendor nao encontrado." });
  });
});

describe("PUT /api/admin/vendors/[id]/registration", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    wpRestMock.mockReset();
  });

  it("forwards the editable representation to the WordPress vendor resource", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    wpRestMock.mockResolvedValue({
      data: { draft: DRAFT, pendingFields: [] },
      ok: true,
      status: 200,
    });

    const response = await PUT(request({ application: APPLICATION, draft: DRAFT }), context());

    expect(wpRestMock).toHaveBeenCalledWith("/papelito/v1/admin/vendors/42/registration", {
      headers: { Authorization: "Bearer admin-token" },
      json: { application: APPLICATION, draft: DRAFT },
      method: "PUT",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ registration: { draft: DRAFT, pendingFields: [] } });
  });

  it("drops any field outside the editable representation", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    wpRestMock.mockResolvedValue({ data: {}, ok: true, status: 200 });

    await PUT(
      request({
        application: APPLICATION,
        draft: DRAFT,
        id: 9,
        role: "administrator",
        sourceUserId: 7,
        temporaryPassword: "nao-deve-ir",
      }),
      context(),
    );

    const [, options] = wpRestMock.mock.calls[0] as [string, { json: unknown }];
    expect(Object.keys(options.json as object)).toEqual(["application", "draft"]);
    expect(JSON.stringify(options.json)).not.toContain("nao-deve-ir");
    expect(JSON.stringify(options.json)).not.toContain("administrator");
  });

  it("rejects a request without an authenticated session", async () => {
    getAdminApiSessionMock.mockResolvedValue({ error: "Não autenticado.", status: 401 });

    const response = await PUT(request({ application: APPLICATION, draft: DRAFT }), context());

    expect(response.status).toBe(401);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("rejects a session that is not an administrator", async () => {
    getAdminApiSessionMock.mockResolvedValue({ error: "Acesso negado.", status: 403 });

    const response = await PUT(request({ application: APPLICATION, draft: DRAFT }), context());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Acesso negado." });
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it.each(["abc", "42abc", "42.9", " 42", "-1", "0", ""])(
    "rejects the invalid vendor id %j before touching WordPress",
    async (id) => {
      getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });

      const response = await PUT(request({ application: APPLICATION }, id), context(id));

      expect(response.status).toBe(400);
      expect(wpRestMock).not.toHaveBeenCalled();
    },
  );

  it("rejects a body that is not an object", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });

    const response = await PUT(
      new Request("http://localhost/api/admin/vendors/42/registration", {
        body: "not-json",
        method: "PUT",
      }),
      context(),
    );

    expect(response.status).toBe(400);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("surfaces the WordPress validation error and its status", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    wpRestMock.mockResolvedValue({
      error: { code: "papelito_vendor_cnpj_exists", message: "Ja existe uma conta com este CNPJ." },
      ok: false,
      status: 409,
    });

    const response = await PUT(request({ application: APPLICATION, draft: DRAFT }), context());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "papelito_vendor_cnpj_exists",
      message: "Ja existe uma conta com este CNPJ.",
    });
  });

  it("surfaces a missing vendor as a 404", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    wpRestMock.mockResolvedValue({
      error: { code: "papelito_vendor_not_found", message: "Vendor nao encontrado." },
      ok: false,
      status: 404,
    });

    const response = await PUT(request({ application: APPLICATION, draft: DRAFT }), context());

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ message: "Vendor nao encontrado." });
  });
});
