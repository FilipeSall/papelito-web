"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

const REVENDEDOR_FORM_HREF = "/revendedor#revendedor-form";

function isRevendedorFormHref(href: string) {
  return href === "#revendedor-form" || href === "/revendedor" || href === REVENDEDOR_FORM_HREF;
}

function focusRevendedorForm(event: React.MouseEvent<HTMLAnchorElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  if (window.location.pathname !== "/revendedor") return;

  const form = document.getElementById("revendedor-form");

  if (!form) return;

  event.preventDefault();

  if (window.location.search || window.location.hash !== "#revendedor-form") {
    window.history.pushState(null, "", REVENDEDOR_FORM_HREF);
  }

  form.scrollIntoView({ block: "start" });
}

type RevendedorFormLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

export function RevendedorFormLink({ href, onClick, ...props }: RevendedorFormLinkProps) {
  const isRevendedorFormCta = isRevendedorFormHref(href);

  return (
    <Link
      {...props}
      href={isRevendedorFormCta ? REVENDEDOR_FORM_HREF : href}
      onClick={
        isRevendedorFormCta && props.target !== "_blank"
          ? (event) => {
              onClick?.(event);
              focusRevendedorForm(event);
            }
          : onClick
      }
    />
  );
}
