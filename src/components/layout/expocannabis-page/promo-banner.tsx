import Image from "next/image";

/** Banner amarelo da campanha, só no Início: "Desconto Progressivo" e a foto do kit girada. */
export function PromoBanner() {
  return (
    <section aria-label="Campanha ExpoDay" className="relative flex min-h-42 flex-none items-center gap-4.5 overflow-hidden rounded-[10px] bg-brand-yellow px-6 py-5.5">
      <div className="relative z-1 -my-2 h-35 w-77.5 min-w-0 flex-1">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em]">Promoção exclusiva</p>
        <p className="mt-2 w-79.75 font-[family-name:var(--font-expo-display)] text-4xl uppercase leading-[1.05]">
          Desconto
          <br />
          Progressivo
        </p>
        <div className="absolute left-0 top-26.5 flex w-max items-center gap-2 bg-[#231F20] py-1.25 pl-2 pr-3">
          <Image src="/images/expocannabis/icone-desconto.png" alt="" width={24} height={24} className="h-6 w-auto flex-none" />
          <span className="whitespace-nowrap text-lg font-medium italic leading-none text-brand-yellow">Garanta até 12% de desconto</span>
        </div>
      </div>
      <div className="relative w-116 flex-none self-stretch">
        <Image
          src="/images/expocannabis/kit-sedas-premium.png"
          alt=""
          width={461}
          height={351}
          className="absolute left-[calc(50%+47px)] top-1/2 h-87.75 w-115.25 max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-8 object-contain"
        />
      </div>
    </section>
  );
}
