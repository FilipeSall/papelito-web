import Link from "next/link";

interface CategoryNavItemProps {
  emoji: string;
  title: string;
  subtitle: string;
  href: string;
  className?: string;
}

export function CategoryNavItem({
  emoji,
  title,
  subtitle,
  href,
  className,
}: CategoryNavItemProps) {
  return (
    <Link
      href={href}
      className={`h-29.75 w-full max-w-[186px] justify-self-center rounded-2xl bg-[#3A3A3A] px-[22px] flex flex-col justify-center gap-1.5 transition-colors hover:bg-[#444444] ${className ?? ""}`}
    >
      <span className="text-2xl leading-8">{emoji}</span>
      <span className="font-black text-sm leading-5 tracking-[-0.150391px] text-white">
        {title}
      </span>
      <span className="text-xs leading-4 text-[#99A1AF]">{subtitle}</span>
    </Link>
  );
}
