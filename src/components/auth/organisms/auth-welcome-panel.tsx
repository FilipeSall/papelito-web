import Image from "next/image";
import Link from "next/link";

export function AuthWelcomePanel() {
  return (
    <div className="relative hidden items-center justify-center bg-brand-yellow lg:flex lg:w-1/2">
      <div className="flex flex-col items-center px-12 text-center">
        <Link
          href="/"
          aria-label="Ir para a página inicial"
          className="mb-8 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-dark"
        >
          <Image
            src="/images/auth/logo-with-flag.svg"
            alt="Marketplace Papelito"
            width={304}
            height={182}
            priority
          />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-dark">
          SEJA BEM-VINDO
        </h1>
        <p className="mt-4 max-w-xs text-lg leading-7 text-brand-dark/70">
          Acesse sua conta e aproveite os melhores produtos do Brasil.
        </p>
      </div>
    </div>
  );
}
