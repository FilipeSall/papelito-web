import { AboutValueCard } from "./about-value-card";
import { ABOUT_VALUES } from "./constants";

export function AboutValuesSection() {
  return (
    <section className="px-4 pt-20 lg:px-0 lg:pt-[58px]">
      <div className="mx-auto max-w-[1192px]">
        <div className="mx-auto max-w-[1122px]">
          <div className="flex flex-col items-center gap-2">
            <span className="text-center text-xs font-black uppercase tracking-[1.2px] text-[#B8960A]">
              O que nos guia
            </span>
            <h2 className="text-center text-[2.25rem] font-black uppercase leading-10 tracking-[0.3691px] text-brand-dark">
              Nossos valores
            </h2>
          </div>

          <div className="mt-14 flex flex-col gap-[31px] lg:mt-4 lg:flex-row lg:items-start lg:justify-center lg:gap-[58px]">
            {ABOUT_VALUES.map((value) => (
              <AboutValueCard key={value.title} value={value} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
