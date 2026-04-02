import Link from "next/link";
import { ArrowRightIcon } from "./icons";

interface SectionHeaderProps {
  emoji: string;
  title: string;
  href?: string;
  linkText?: string;
  variant?: "default" | "compact";
  label?: string;
}

export function SectionHeader({
  emoji,
  title,
  href,
  linkText = "Ver todos",
  variant = "default",
  label,
}: SectionHeaderProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 h-8">
        <div className="flex items-center justify-center size-8 bg-brand-yellow rounded-full">
          <span className="text-sm">{emoji}</span>
        </div>

        <h2 className="font-black text-2xl leading-8 tracking-[0.0703px] uppercase text-brand-dark">
          {title}
        </h2>

        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 ml-auto text-brand-dark hover:opacity-70 transition-opacity"
          >
            <span className="font-black text-sm leading-5 tracking-[-0.150391px] uppercase">
              {linkText}
            </span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
        )}
      </div>
    );
  }

  const titleLines = title.split("\n");

  return (
    <div className="flex items-end justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 h-8">
          <span className="text-2xl leading-8">{emoji}</span>
          {label && (
            <span className="font-black text-xs leading-4 tracking-[1.2px] uppercase text-brand-dark">
              {label}
            </span>
          )}
        </div>
        <h2 className="font-black text-4xl leading-9 tracking-[0.369141px] uppercase text-brand-dark">
          {titleLines.map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </h2>
      </div>

      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 bg-brand-dark text-white px-6 py-3 rounded-full hover:opacity-80 transition-opacity"
        >
          <span className="font-black text-sm leading-5 tracking-[-0.150391px] uppercase">
            {linkText}
          </span>
          <ArrowRightIcon className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
