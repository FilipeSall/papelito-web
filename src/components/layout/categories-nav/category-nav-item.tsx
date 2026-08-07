import Image from "next/image";
import Link from "next/link";

interface CategoryNavItemProps {
  iconSrc: string;
  title: string;
  subtitle: string;
  href: string;
  className?: string;
}

export function CategoryNavItem({
  iconSrc,
  title,
  subtitle,
  href,
  className,
}: CategoryNavItemProps) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[152px] w-full max-w-none flex-col justify-between overflow-hidden rounded-[22px] bg-brand-dark px-5 py-4 text-left shadow-[0_5px_0_#231f20] transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:bg-[#343031] hover:shadow-[0_9px_0_#231f20] focus-visible:-translate-y-1 focus-visible:bg-[#343031] focus-visible:shadow-[0_9px_0_#231f20] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow active:translate-y-0 active:shadow-[0_3px_0_#231f20] sm:min-h-40 sm:px-6 sm:py-5 ${className ?? ""}`}
    >
      <span aria-hidden className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rotate-45 bg-white/[0.035]" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ease-out group-hover:scale-105 group-focus-visible:scale-105 sm:h-14 sm:w-14">
          <Image
            alt=""
            aria-hidden
            className="h-10 w-10 object-contain sm:h-11 sm:w-11"
            height={40}
            src={iconSrc}
            unoptimized
            width={40}
          />
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white transition-colors duration-200 group-hover:border-brand-yellow group-hover:bg-brand-yellow group-hover:text-brand-dark group-focus-visible:border-brand-yellow group-focus-visible:bg-brand-yellow group-focus-visible:text-brand-dark">
          <svg
            aria-hidden
            className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
            fill="none"
            viewBox="0 0 16 16"
          >
            <path
              d="M3 8h10m-4-4 4 4-4 4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
        </span>
      </div>
      <div className="relative mt-2">
        <span className="mb-2 block h-0.5 w-7 bg-brand-yellow transition-[width] duration-200 ease-out group-hover:w-11 group-focus-visible:w-11" />
        <span className="block font-black text-base leading-none tracking-[-0.02em] text-white sm:text-lg">
          {title}
        </span>
        <span className="mt-1.5 block text-xs leading-4 text-[#c7cbd1]">{subtitle}</span>
      </div>
    </Link>
  );
}
