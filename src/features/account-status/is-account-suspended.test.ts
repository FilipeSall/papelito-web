import { describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { isAccountSuspended } from "./is-account-suspended";

function sessionWith(accountStatus?: string): Session {
  return { expires: "", b2b: accountStatus ? { accountStatus } : {} } as Session;
}

describe("isAccountSuspended", () => {
  it("é falso sem sessão", () => {
    expect(isAccountSuspended(null)).toBe(false);
    expect(isAccountSuspended(undefined)).toBe(false);
  });

  it("é falso quando o contexto B2B não trouxe o estado", () => {
    expect(isAccountSuspended(sessionWith())).toBe(false);
  });

  it("é falso para conta ativa", () => {
    expect(isAccountSuspended(sessionWith("active"))).toBe(false);
  });

  it("é verdadeiro só para conta suspensa", () => {
    expect(isAccountSuspended(sessionWith("suspended"))).toBe(true);
  });
});
