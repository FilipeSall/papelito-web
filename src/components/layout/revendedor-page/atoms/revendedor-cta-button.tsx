import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

type RevendedorCtaButtonProps = {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  target?: string;
  type?: "button" | "reset" | "submit";
  variant?: "outline" | "yellow";
};

/**
 * Botao CTA reutilizavel para links e acoes da landing `/revendedor`.
 */
export function RevendedorCtaButton({
  children,
  className = "",
  compact = false,
  disabled = false,
  href,
  onClick,
  target,
  type = "button",
  variant = "yellow",
}: RevendedorCtaButtonProps) {
  const sizeClass = compact ? "h-11 px-6 text-sm" : "h-13 px-8 text-sm";
  const variantClass =
    variant === "outline"
      ? "border-2 border-brand-dark bg-transparent text-brand-dark hover:bg-brand-dark hover:text-white"
      : "bg-brand-yellow text-brand-dark shadow-[0px_10px_15px_0px_rgba(255,229,0,0.2),0px_4px_6px_0px_rgba(255,229,0,0.2)] hover:brightness-95";

  const content = (
    <>
      <span className="font-black uppercase tracking-[-0.1504px]">{children}</span>
      <ArrowRightIcon className="size-4 shrink-0" size={20} strokeWidth={1.8} />
    </>
  );

  const sharedClassName =
    `inline-flex items-center justify-center gap-3 rounded-full transition ${sizeClass} ${variantClass} ${className}`.trim();

  if (href) {
    if (target === "_blank") {
      return (
        <a className={sharedClassName} href={href} rel="noopener noreferrer" target="_blank">
          {content}
        </a>
      );
    }

    return (
      <Link className={sharedClassName} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={`${sharedClassName} disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {content}
    </button>
  );
}
