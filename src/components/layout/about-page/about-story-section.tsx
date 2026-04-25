import { AboutCtaLink } from "./about-cta-link";
import { AboutFactoryImage } from "./atoms/about-factory-image";
import { ABOUT_STORY_CONTENT } from "./constants";

export function AboutStorySection() {
  return (
    <section className="px-4 pt-9 lg:px-0 lg:pt-[51px]">
      <div className="mx-auto max-w-[1020px] lg:grid lg:grid-cols-[486px_486px] lg:gap-12">
        <div className="relative">
          <div className="relative h-[420px] overflow-hidden rounded-2xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
            <AboutFactoryImage
              className="object-cover object-[48%_center] lg:object-[52%_center]"
              priority
              sizes="(max-width: 1023px) calc(100vw - 32px), 486px"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[68px] bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent px-6 pt-6 lg:block">
              <div className="flex items-center gap-2">
                <span aria-hidden className="h-1 w-8 bg-brand-yellow" />
                <span className="text-sm font-black uppercase tracking-[1.2496px] text-white/80">
                  Fabrica Papelito | Brasilia - DF
                </span>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -left-4 -top-4 hidden h-[420px] w-[486px] rounded-2xl border-2 border-brand-yellow lg:block" />
        </div>

        <div className="pt-12 lg:pt-0">
          <span className="text-xs font-black uppercase tracking-[1.2px] text-[#B8960A] lg:text-brand-yellow">
            {ABOUT_STORY_CONTENT.eyebrow}
          </span>

          <h1 className="mt-3 max-w-[342px] text-[2.25rem] font-black uppercase leading-[2.8125rem] tracking-[0.3691px] text-brand-dark lg:mt-2 lg:max-w-[406px]">
            {ABOUT_STORY_CONTENT.title}
          </h1>

          <div className="mt-6 space-y-10 text-base leading-[1.625rem] tracking-[-0.3125px] text-[#4A5565] lg:hidden">
            {ABOUT_STORY_CONTENT.mobileParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-6 hidden space-y-[34px] text-base leading-[1.625rem] tracking-[-0.3125px] text-[#4A5565] lg:block">
            {ABOUT_STORY_CONTENT.desktopParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 lg:mt-[60px] lg:flex-row lg:gap-3">
            <AboutCtaLink href="/produtos" label="Ver Produtos" />
            <AboutCtaLink href="/cadastro" label="Seja Revendedor" variant="outline" />
          </div>
        </div>
      </div>
    </section>
  );
}
