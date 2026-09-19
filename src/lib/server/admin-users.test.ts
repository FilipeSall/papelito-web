import { beforeEach, describe, expect, it, vi } from "vitest";

const wpRestMock = vi.fn();

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

import { getAdminUsersSnapshot } from "./admin-users";

const filters = {
  page: 1,
  perPage: 20,
  relation: "all" as const,
  role: "all" as const,
  search: "",
  status: "all" as const,
};

describe("getAdminUsersSnapshot", () => {
  beforeEach(() => {
    wpRestMock.mockReset();
  });

  it("descarta objetos inesperados sem expor a string [object Object]", async () => {
    wpRestMock.mockResolvedValue({
      data: {
        issues: ["Aviso legível", { code: "unexpected" }],
        rows: [
          {
            accountStatus: { invalid: true },
            company: {
              companyCnpj: { invalid: true },
              companyId: 7,
              companyName: { invalid: true },
              companyStatus: { invalid: true },
              membershipRole: { invalid: true },
              membershipStatus: { invalid: true },
            },
            id: 42,
          },
        ],
      },
      ok: true,
    });

    const snapshot = await getAdminUsersSnapshot("token", filters);

    expect(snapshot.issues).toEqual(["Aviso legível"]);
    expect(snapshot.rows[0]).toMatchObject({
      accountStatus: "",
      company: {
        companyCnpj: "",
        companyName: "",
        companyStatus: "",
        membershipRole: "",
        membershipStatus: "",
      },
      id: 42,
    });
  });

  it("mantém somente identificadores válidos de candidatura pré-conta", async () => {
    wpRestMock.mockResolvedValue({
      data: {
        rows: [
          { id: "pre:17", recordType: "pre_account_application" },
          { id: "17", recordType: "pre_account_application" },
        ],
      },
      ok: true,
    });

    const snapshot = await getAdminUsersSnapshot("token", filters);

    expect(snapshot.rows.map(({ id }) => id)).toEqual(["pre:17"]);
  });
});
