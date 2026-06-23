import Link from "next/link";

import { Panel } from "@/components/layout/operational-panel";

export function VendorOnboardingRequiredNotice({
  body,
  href,
  title,
}: {
  body: string;
  href: string;
  title: string;
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="bg-brand-yellow px-5 py-3 text-brand-dark">
        <p className="text-[10px] font-black uppercase tracking-[0.25em]">Cadastro pendente</p>
      </div>
      <div className="space-y-5 px-5 py-6 md:px-6">
        <div className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
          <h3
            className="text-2xl font-semibold uppercase tracking-widest"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            {title}
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-brand-dark/68">{body}</p>
        <Link
          className="inline-flex h-11 w-fit cursor-pointer items-center justify-center whitespace-nowrap border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
          href={href}
        >
          Completar cadastro
        </Link>
      </div>
    </Panel>
  );
}
