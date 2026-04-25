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
    <section className="w-full border-b border-[#F3F4F6] bg-white">
      <div className="mx-auto max-w-450">
        <div className="grid grid-cols-2 border-t border-brand-yellow md:hidden max-[360px]:hidden">
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
        <div className="hidden flex-col border-t border-brand-yellow md:hidden max-[360px]:flex">
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

        <div className="mx-auto hidden md:grid md:h-17 md:grid-cols-4 md:px-4 lg:px-8 xl:px-43.5">
          {FEATURES_BAR_ITEMS.map((item, index) => (
            <div
              key={item.title}
              className={`flex items-center pl-6 ${
                index !== FEATURES_BAR_ITEMS.length - 1 ? "border-r border-[#F3F4F6]" : ""
              }`}
            >
              <FeatureItem
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                className="h-17 w-full"
                contentClassName="h-9 justify-start"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
