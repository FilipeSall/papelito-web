import Image from "next/image";
import Link from "next/link";

import { resolveLogo } from "@/lib/site-logos";
import type { ManagedImageAsset } from "@/types/home-assets";

type PrivateHeaderLogoProps = {
  logo?: ManagedImageAsset;
};

export function PrivateHeaderLogo({ logo }: PrivateHeaderLogoProps) {
  const resolved = resolveLogo("privateHeader", logo);

  return (
    <Link
      aria-label="Ir para a home"
      className="inline-flex w-fit shrink-0 items-center justify-self-start"
      href="/"
    >
      <Image
        alt={resolved.alt}
        height={73}
        className="h-9 w-auto md:h-18.25"
        priority
        src={resolved.imageUrl}
        width={123}
      />
    </Link>
  );
}
