import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SITE_LOGO_DEFAULTS } from "@/lib/site-logos";

import { PublicHeaderLogo } from "./logo";

describe("PublicHeaderLogo", () => {
  it("usa a logo administrada no slot das rotas públicas", () => {
    render(
      <PublicHeaderLogo
        logo={{ imageId: 42, imageUrl: "/uploads/logo-publica.svg", alt: "Logo pública" }}
        variant="desktop"
      />,
    );

    expect(screen.getByAltText("Logo pública")).toHaveAttribute(
      "src",
      expect.stringContaining("logo-publica.svg"),
    );
  });

  it("cai no padrão do slot publicHeader quando nada foi enviado", () => {
    render(<PublicHeaderLogo variant="mobile" />);

    expect(screen.getByAltText(SITE_LOGO_DEFAULTS.publicHeader.alt)).toHaveAttribute(
      "src",
      expect.stringContaining("marketplacelogo.svg"),
    );
  });
});
