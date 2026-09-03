import { describe, expect, it } from "vitest";

import {
  buildAdminUsersQuery,
  parseAdminUsersFilters,
  type AdminUsersFilters,
} from "./admin-users-filters";

const base: AdminUsersFilters = {
  page: 1,
  perPage: 20,
  relation: "all",
  role: "all",
  search: "",
  status: "all",
};

describe("parseAdminUsersFilters", () => {
  it("cai no padrão quando os parâmetros são desconhecidos", () => {
    const filters = parseAdminUsersFilters({
      relation: "qualquer",
      role: "chefe",
      status: "banida",
    });

    expect(filters).toMatchObject({ relation: "all", role: "all", status: "all" });
  });

  it("aceita os recortes de situação e vínculo", () => {
    const filters = parseAdminUsersFilters({
      relation: "company",
      role: "seller",
      status: "suspended",
    });

    expect(filters).toMatchObject({
      relation: "company",
      role: "seller",
      status: "suspended",
    });
  });
});

describe("buildAdminUsersQuery", () => {
  it("omite os valores padrão", () => {
    expect(buildAdminUsersQuery(base)).toBe("");
  });

  it("serializa situação e vínculo", () => {
    const query = buildAdminUsersQuery({
      ...base,
      relation: "unlinked",
      status: "suspended",
    });

    expect(new URLSearchParams(query).get("status")).toBe("suspended");
    expect(new URLSearchParams(query).get("relation")).toBe("unlinked");
  });

  it("aplica overrides sem perder os demais filtros", () => {
    const query = buildAdminUsersQuery(
      { ...base, search: "seda", status: "suspended" },
      { page: 3 },
    );
    const params = new URLSearchParams(query);

    expect(params.get("page")).toBe("3");
    expect(params.get("search")).toBe("seda");
    expect(params.get("status")).toBe("suspended");
  });
});
