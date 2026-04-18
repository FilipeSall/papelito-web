import { FeatureItem } from "./feature-item";
import { FEATURES_BAR_ITEMS } from "./constants";

/**
 * Barra de benefícios exibida imediatamente abaixo do hero section.
 *
 * Apresenta quatro itens informativos — frete grátis, troca fácil,
 * parcelamento e envio rápido — em layout horizontal com separadores
 * verticais e fundo branco.
 */
export function FeaturesBar() {
  return (
    <section className="w-full bg-white border-b border-[#F3F4F6]">
      <div className="mx-auto max-w-450 md:hidden">
        <div className="grid grid-cols-2 border-t border-brand-yellow max-[360px]:hidden">
          {FEATURES_BAR_ITEMS.map((item, index) => (
            <div
              key={item.title}
              className={`flex items-center justify-center ${
                index % 2 === 0 ? "border-r border-[#F3F4F6]" : ""
              } ${index < 2 ? "border-b border-[#F3F4F6]" : ""}
              `}
            >
              <FeatureItem
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                className="flex w-[10.67256rem] h-[5.24956rem] pl-[0.99994rem] items-center gap-[0.74994rem]"
              />
            </div>
          ))}
        </div>

        {/* fallback for very narrow mobile widths */}
        <div className="hidden flex-col border-t border-brand-yellow max-[360px]:flex">
          {FEATURES_BAR_ITEMS.map((item, index) => (
            <div
              key={`${item.title}-stack`}
              className={`flex items-center justify-center ${
                index !== FEATURES_BAR_ITEMS.length - 1 ? "border-b border-[#F3F4F6]" : ""
              }`}
            >
              <FeatureItem
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                className="flex w-[10.67256rem] h-[5.24956rem] pl-[0.99994rem] items-center gap-[0.74994rem]"
              />
            </div>
          ))}
        </div>

        <div className="mx-auto hidden h-18 max-w-450 flex-row px-4 sm:px-6 md:flex lg:px-8 xl:px-43.5">
          {FEATURES_BAR_ITEMS.map((item, index) => (
            <div
              key={item.title}
              className={`flex flex-1 items-center pl-6 ${
                index !== FEATURES_BAR_ITEMS.length - 1 ? "border-r border-[#F3F4F6]" : ""
              }`}
            >
              <FeatureItem
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                className="h-[72px] w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
