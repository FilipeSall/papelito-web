import Image from "next/image";

export function AuthWelcomePanel() {
  return (
    <div className="relative hidden items-center justify-center bg-brand-yellow lg:flex lg:w-1/2">
      <div className="flex flex-col items-center px-12 text-center">
        <Image
          src="/images/auth/logo-with-flag.svg"
          alt="Marketplace Papelito"
          width={304}
          height={182}
          className="mb-8"
          priority
        />
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
