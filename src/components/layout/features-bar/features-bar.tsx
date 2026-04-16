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
      <div className="mx-auto flex h-18 max-w-450 flex-row px-4 sm:px-6 lg:px-8 xl:px-43.5">
        {FEATURES_BAR_ITEMS.map((item, index) => (
          <FeatureItem
            key={item.title}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            isLast={index === FEATURES_BAR_ITEMS.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
