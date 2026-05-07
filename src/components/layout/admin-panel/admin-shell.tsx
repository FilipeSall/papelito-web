"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "./admin-config";

function getCurrentNavItem(pathname: string) {
  return ADMIN_NAV_ITEMS.find((item) => item.href === pathname) ?? ADMIN_NAV_ITEMS[0];
}

function getNavItemClassName(active: boolean) {
  return [
    "group block w-full overflow-hidden rounded-[18px] border px-4 py-4 transition-all duration-200",
    active
      ? "border-[#ffe500] bg-[#ffe500] text-[#231f20] shadow-[0_12px_28px_rgba(255,229,0,0.14)]"
      : "border-transparent bg-transparent text-[#f5f1e8] hover:border-white/10 hover:bg-white/[0.045]",
  ].join(" ");
}

function getMobileNavClassName(active: boolean) {
  return [
    "inline-flex min-h-11 items-center rounded-[16px] border px-3.5 py-2 text-sm font-semibold tracking-[0.08em] uppercase transition-colors",
    active
      ? "border-[#231f20] bg-[#ffe500] text-[#231f20] shadow-[0_6px_0_rgba(35,31,32,0.16)]"
      : "border-[#231f20]/12 bg-white/78 text-[#231f20]/72 hover:border-[#231f20]/24",
  ].join(" ");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentItem = getCurrentNavItem(pathname);

  return (
    <div className="min-h-full bg-[#ede9df] text-[#231f20]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          backgroundImage: [
            "linear-gradient(to right, rgba(35,31,32,0.06) 1px, transparent 1px)",
            "linear-gradient(to bottom, rgba(35,31,32,0.06) 1px, transparent 1px)",
            "radial-gradient(circle at top left, rgba(255,229,0,0.28), transparent 32%)",
          ].join(","),
          backgroundPosition: "0 0, 0 0, 0 0",
          backgroundSize: "28px 28px, 28px 28px, 100% 100%",
        }}
      />

      <div className="relative flex min-h-full">
        <aside className="hidden w-[292px] shrink-0 border-r-2 border-[#0e0d0d] bg-[#171516] text-[#f5f1e8] lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ffe500]">
              Control Room
            </div>
            <div className="mt-4">
              <div>
                <p
                  className="text-[2rem] font-semibold uppercase leading-none tracking-[0.12em] text-[#ffe500]"
                  style={{ fontFamily: "var(--font-admin-display)" }}
                >
                  Papelito
                </p>
                <p className="mt-2 max-w-[19ch] text-sm leading-5 text-white/58">
                  Area administrativa com leitura mais limpa e foco na operacao.
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5 px-4 py-5">
            {ADMIN_NAV_ITEMS.map((item, index) => {
              const active = item.href === currentItem.href;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={getNavItemClassName(active)}
                >
                  <div className="flex w-full items-start gap-4">
                    <span
                      className={[
                        "mt-0.5 inline-flex h-8 min-w-8 items-center justify-center rounded-full text-[11px] font-semibold uppercase tracking-[0.18em]",
                        active
                          ? "bg-[#231f20] text-[#ffe500]"
                          : "bg-white/7 text-white/42 group-hover:bg-white/10 group-hover:text-white/58",
                      ].join(" ")}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-base font-semibold uppercase tracking-[0.08em]"
                        style={{ fontFamily: "var(--font-admin-display)" }}
                      >
                        {item.label}
                      </p>
                      <p className={`mt-1 text-sm leading-5 ${active ? "text-[#231f20]/72" : "text-white/52"}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 px-4 py-5">
            <div className="rounded-[18px] border border-white/12 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/46">
                Shell administrativa
              </p>
              <p className="mt-3 text-sm leading-6 text-white/62">
                O header superior segue o mesmo padrao do perfil para acesso rapido a home e outras
                areas do site.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30 border-b-2 border-[#231f20] bg-[#efe9dd]/95 backdrop-blur lg:hidden">
            <div className="px-4 py-4">
              <div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#231f20]/56">
                    Admin / Papelito
                  </p>
                  <p
                    className="mt-1 text-xl font-semibold uppercase tracking-[0.1em]"
                    style={{ fontFamily: "var(--font-admin-display)" }}
                  >
                    {currentItem.label}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {ADMIN_NAV_ITEMS.map((item) => {
                  const active = item.href === currentItem.href;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={getMobileNavClassName(active)}
                    >
                      <span className="opacity-52">{String(ADMIN_NAV_ITEMS.indexOf(item) + 1).padStart(2, "0")}</span>
                      <span className="ml-2">{item.shortLabel}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="sticky top-0 z-20 hidden border-b-2 border-[#231f20] bg-[#efe9dd]/94 backdrop-blur lg:block">
            <div className="px-8 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#231f20]/54">
                Papelito / Admin / {currentItem.shortLabel}
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <h1
                  className="text-[2rem] font-semibold uppercase leading-none tracking-[0.08em]"
                  style={{ fontFamily: "var(--font-admin-display)" }}
                >
                  {currentItem.label}
                </h1>
                <p className="pb-0.5 text-sm text-[#231f20]/58">
                  Navegacao global pelo header e navegacao da area pela sidebar.
                </p>
              </div>
            </div>
          </div>

          <main className="flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
