import Link from "next/link";

interface CategoryNavItemProps {
  emoji: string;
  title: string;
  subtitle: string;
  href: string;
}

export function CategoryNavItem({
  emoji,
  title,
  subtitle,
  href,
}: CategoryNavItemProps) {
  return (
    <Link
      href={href}
      className="w-[186px] h-29.75 shrink-0 bg-[#3A3A3A] rounded-2xl flex flex-col justify-center px-[22px] gap-1.5 transition-colors hover:bg-[#444444]"
    >
      <span className="text-2xl leading-8">{emoji}</span>
      <span className="font-black text-sm leading-5 tracking-[-0.150391px] text-white">
        {title}
      </span>
      <span className="text-xs leading-4 text-[#99A1AF]">{subtitle}</span>
    </Link>
  );
}
