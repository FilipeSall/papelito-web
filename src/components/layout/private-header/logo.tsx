import Image from "next/image";
import Link from "next/link";

export function PrivateHeaderLogo() {
  return (
    <Link
      aria-label="Ir para a home"
      className="inline-flex w-fit shrink-0 items-center justify-self-start"
      href="/"
    >
      <Image
        alt="Papelito"
        height={73}
        className="h-9 w-auto md:h-[73px]"
        priority
        src="/images/logo.svg"
        width={123}
      />
    </Link>
  );
}
