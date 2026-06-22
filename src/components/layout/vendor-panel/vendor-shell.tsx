"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PrivateHeaderLogoutButton } from "@/components/layout/private-header/logout-button";
import { NotificationBell } from "@/components/layout/site-header";

import { getVendorPageTitle, VENDOR_NAV_ITEMS } from "./vendor-config";

function navClassName(active: boolean) {
  return [
    "group flex items-center gap-3 rounded-[18px] border px-4 py-3 transition",
    active
      ? "border-brand-yellow bg-brand-yellow text-brand-dark"
      : "border-transparent text-white/72 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
  ].join(" ");
}

export function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = getVendorPageTitle(pathname);

  return (
    <div className="relative h-screen overflow-hidden bg-[#ede9df] text-brand-dark">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(35,31,32,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(35,31,32,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative flex h-full">
        <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-white/10 bg-brand-dark text-white lg:flex">
          <Link className="border-b border-white/10 px-6 py-7" href="/vendor/dashboard">
            <Image alt="Papelito" height={34} priority src="/images/logo2.svg" width={114} />
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-yellow/76">
              Area do vendor
            </p>
          </Link>
          <nav aria-label="Navegacao do vendor" className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5">
            {VENDOR_NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link className={navClassName(active)} href={item.href} key={item.href}>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                      active ? "bg-brand-dark text-brand-yellow" : "bg-white/8 text-white/64"
                    }`}
                  >
                    <Icon aria-hidden className="h-4 w-4" />
                  </span>
                  <span>
                    <span
                      className="block text-sm font-semibold uppercase tracking-[0.12em]"
                      style={{ fontFamily: "var(--font-admin-display)" }}
                    >
                      {item.label}
                    </span>
                    <span className={`block text-xs ${active ? "text-brand-dark/65" : "text-white/44"}`}>
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-5">
            <Link className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55 hover:text-white" href="/">
              Voltar ao site
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <header className="sticky top-0 z-30 border-b-2 border-brand-dark bg-[#efe9dd]/95 backdrop-blur">
            <div className="flex min-h-18 items-center justify-between gap-4 px-4 py-3 md:px-7">
              <div className="flex items-center gap-4">
                <Image alt="Papelito" className="lg:hidden" height={30} src="/images/logo3.svg" width={100} />
                <div>
                  <p className="hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-dark/48 sm:block">
                    Vendor / Operacao
                  </p>
                  <h1
                    className="text-lg font-semibold uppercase tracking-[0.12em] sm:text-xl"
                    style={{ fontFamily: "var(--font-admin-display)" }}
                  >
                    {title}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <PrivateHeaderLogoutButton />
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto border-t border-brand-dark/8 px-4 py-3 lg:hidden" aria-label="Secoes do painel">
              {VENDOR_NAV_ITEMS.map((item) => (
                <Link
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
                    pathname.startsWith(item.href)
                      ? "border-brand-dark bg-brand-dark text-brand-yellow"
                      : "border-brand-dark/15 bg-white/65 text-brand-dark/70"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="flex-1 px-4 py-5 md:px-7 md:py-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
