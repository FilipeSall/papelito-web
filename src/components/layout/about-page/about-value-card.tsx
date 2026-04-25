import { AboutValueIconImage } from "./atoms/about-value-icon-image";
import type { AboutValue } from "./constants";

type AboutValueCardProps = {
  value: AboutValue;
};

export function AboutValueCard({ value }: AboutValueCardProps) {
  return (
    <article className="flex min-h-[254px] w-full flex-col gap-3 rounded-2xl bg-[#F9FAFB] p-6 md:h-[415px] md:w-[261px] md:gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-[0.875rem] bg-brand-yellow px-[0.8125rem]">
        <AboutValueIconImage
          alt={value.iconAlt}
          className={`block h-auto max-h-[1.875rem] w-auto max-w-full object-contain ${
            value.iconClassName ?? ""
          }`}
          height={value.iconHeight}
          src={value.iconSrc}
          width={value.iconWidth}
        />
      </div>

      <h3 className="text-[1.125rem] font-black leading-7 tracking-[-0.4395px] text-brand-dark">
        {value.title}
      </h3>

      <p className="text-sm leading-[1.625rem] tracking-[-0.150391px] text-[#6A7282] md:leading-[1.42rem]">
        {value.description}
      </p>
    </article>
  );
}
