import Image from "next/image";

export function LoadingOverlay() {
  return (
    <output className="fixed inset-0 z-1600 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm transition-opacity duration-300 opacity-100">
      <div className="relative size-28">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-brand-yellow/25 border-t-brand-yellow" />
        <div className="absolute inset-2 flex items-center justify-center rounded-full bg-brand-yellow shadow-2xl">
          <Image
            alt="Papelito"
            height={42}
            priority
            src="/images/logo.svg"
            width={70}
          />
        </div>
      </div>
      <span className="sr-only">Carregando…</span>
    </output>
  );
}
