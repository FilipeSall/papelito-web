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
      <div className="max-w-450 mx-auto px-43.5 flex flex-row h-18">
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
