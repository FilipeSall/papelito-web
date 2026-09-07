import { describe, expect, it } from "vitest";

import {
  DEFAULT_SOCIAL_PROFILES,
  isValidSocialProfileUrl,
  normalizeSocialProfiles,
  resolveSocialProfiles,
} from "./social-profiles";

describe("normalizeSocialProfiles", () => {
  it("cai no padrão quando o WordPress não devolve o bloco social", () => {
    expect(normalizeSocialProfiles(undefined)).toEqual(DEFAULT_SOCIAL_PROFILES);
  });

  it("preserva o vazio gravado pelo admin em vez de restaurar o padrão", () => {
    const profiles = normalizeSocialProfiles({ instagram: "", x: "https://x.com/outro" });

    expect(profiles.instagram).toBe("");
    expect(profiles.x).toBe("https://x.com/outro");
    expect(profiles.youtube).toBe(DEFAULT_SOCIAL_PROFILES.youtube);
  });
});

describe("resolveSocialProfiles", () => {
  it("mantém a ordem do catálogo e usa os padrões sem configuração", () => {
    expect(resolveSocialProfiles().map((profile) => profile.id)).toEqual([
      "instagram",
      "youtube",
      "linkedin",
      "tiktok",
      "x",
    ]);
    expect(resolveSocialProfiles()[0].href).toBe(DEFAULT_SOCIAL_PROFILES.instagram);
  });

  it("omite a rede que o admin deixou em branco", () => {
    const ids = resolveSocialProfiles({ tiktok: "" }).map((profile) => profile.id);

    expect(ids).not.toContain("tiktok");
    expect(ids).toContain("instagram");
  });

  it("usa o link configurado no lugar do padrão", () => {
    const linkedin = resolveSocialProfiles({
      linkedin: "https://www.linkedin.com/company/outra/",
    }).find((profile) => profile.id === "linkedin");

    expect(linkedin?.href).toBe("https://www.linkedin.com/company/outra/");
  });
});

describe("isValidSocialProfileUrl", () => {
  it("aceita http, https e o vazio que oculta o ícone", () => {
    expect(isValidSocialProfileUrl("https://x.com/papelito_brasil")).toBe(true);
    expect(isValidSocialProfileUrl("http://exemplo.com")).toBe(true);
    expect(isValidSocialProfileUrl("   ")).toBe(true);
  });

  it("recusa esquema não navegável e texto solto", () => {
    expect(isValidSocialProfileUrl("javascript:alert(1)")).toBe(false);
    expect(isValidSocialProfileUrl("instagram.com/papelitobrasil")).toBe(false);
    expect(isValidSocialProfileUrl(`https://x.com/${"a".repeat(300)}`)).toBe(false);
  });
});
