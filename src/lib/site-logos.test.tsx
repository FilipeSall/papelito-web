import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivateHeaderLogo } from "@/components/layout/private-header/logo";
import { FooterLogo } from "@/components/layout/public-footer/footer-logo";
import { PublicHeaderLogo } from "@/components/layout/public-header/logo";
import { SITE_LOGO_DEFAULTS, isDefaultLogo, mapSiteLogos } from "@/lib/site-logos";

const CUSTOM = {
  imageId: 91,
  imageUrl: "http://localhost:8080/wp-content/uploads/2026/07/custom.svg",
  alt: "Logo personalizada",
};

describe("mapSiteLogos", () => {
  it("fills every key from the defaults when WordPress returns nothing", () => {
    expect(mapSiteLogos(undefined)).toEqual(SITE_LOGO_DEFAULTS);
    expect(mapSiteLogos({})).toEqual(SITE_LOGO_DEFAULTS);
  });

  it("keeps a customized key and defaults the others independently", () => {
    const mapped = mapSiteLogos({ privateHeader: CUSTOM });

    expect(mapped.privateHeader).toEqual(CUSTOM);
    expect(mapped.publicHeader).toEqual(SITE_LOGO_DEFAULTS.publicHeader);
    expect(mapped.footer).toEqual(SITE_LOGO_DEFAULTS.footer);
  });

  it("falls back when the stored url or alt is blank", () => {
    const mapped = mapSiteLogos({ footer: { imageId: 0, imageUrl: "   ", alt: "" } });

    expect(mapped.footer).toEqual(SITE_LOGO_DEFAULTS.footer);
  });

  it("detects whether a logo is still the project default", () => {
    expect(isDefaultLogo("privateHeader", SITE_LOGO_DEFAULTS.privateHeader)).toBe(true);
    expect(isDefaultLogo("privateHeader", CUSTOM)).toBe(false);
  });
});

describe("logo consumers", () => {
  it("renders /images/marketplacelogo.svg on private routes without customization", () => {
    render(<PrivateHeaderLogo />);

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", "/images/marketplacelogo.svg");
    expect(image).toHaveAttribute("alt", "Marketplace Papelito");
  });

  it("prefers the configured logo on private routes", () => {
    render(<PrivateHeaderLogo logo={CUSTOM} />);

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", expect.stringContaining("custom.svg"));
    expect(image).toHaveAttribute("alt", "Logo personalizada");
  });

  it("keeps the public header on its own default", () => {
    render(<PublicHeaderLogo variant="desktop" />);

    expect(screen.getByRole("img")).toHaveAttribute("src", "/images/logo.svg");
  });

  it("keeps the footer on its own default", () => {
    render(<FooterLogo />);

    expect(screen.getByAltText("Papelito")).toHaveAttribute("src", "/images/logo3.svg");
  });

  it("applies a configured footer logo without touching the other areas", () => {
    render(
      <>
        <FooterLogo logo={CUSTOM} />
        <PublicHeaderLogo variant="mobile" />
      </>,
    );

    expect(screen.getByAltText("Logo personalizada")).toHaveAttribute(
      "src",
      expect.stringContaining("custom.svg"),
    );
    expect(screen.getByAltText("Papelito")).toHaveAttribute("src", "/images/logo.svg");
  });
});
