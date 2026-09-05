"use client";

import { ArrowRightIcon } from "@/components/ui/icons";
import { RevendedorFormLink } from "../revendedor-form-link";

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
  const sizeClass = compact ? "h-11 px-6 text-sm" : "h-11.5 px-8 text-sm";
  const variantClass =
    variant === "outline"
      ? "border-2 border-brand-dark bg-transparent text-brand-dark hover:bg-brand-dark hover:text-white"
      : "bg-brand-yellow text-brand-dark hover:brightness-95";
  const shouldUseExternalIcon = target === "_blank";

  const content = (
    <>
      <span className="font-black uppercase tracking-[-0.1504px]">{children}</span>
      {shouldUseExternalIcon ? (
        <OpenInNewIcon className="size-4 shrink-0" />
      ) : (
        <ArrowRightIcon className="size-4 shrink-0" size={20} strokeWidth={1.8} />
      )}
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
      <RevendedorFormLink className={sharedClassName} href={href} target={target}>
        {content}
      </RevendedorFormLink>
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

function OpenInNewIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 5H5.75A1.75 1.75 0 0 0 4 6.75v7.5C4 15.2165 4.7835 16 5.75 16h7.5A1.75 1.75 0 0 0 15 14.25V12" />
      <path d="M10 10L16 4" />
      <path d="M11.5 4H16V8.5" />
    </svg>
  );
}
