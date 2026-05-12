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
        height={36}
        priority
        src="/images/logo2.svg"
        width={121}
      />
    </Link>
  );
}
