import { ADMIN_NAV_ITEMS, type AdminSectionKey } from "./admin-config";
import { HERO_METRICS, SECTION_META } from "./mock-data";
import { Panel, StatusBadge } from "./primitives";

export function SectionHeader({ section }: { section: AdminSectionKey }) {
  const meta = SECTION_META[section];
  const navItem = ADMIN_NAV_ITEMS.find((item) => item.key === section) ?? ADMIN_NAV_ITEMS[0];

  return (
    <section className="grid gap-4 xl:grid-cols-[1.6fr_0.8fr]">
      <Panel className="overflow-hidden">
        <div className="border-b border-[#231f20]/10 bg-[#231f20] px-5 py-3 text-[#ffe500] md:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em]">{meta.eyebrow}</p>
        </div>
        <div className="relative px-5 py-6 md:px-6 md:py-7">
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden md:block"
            style={{
              background: [
                "radial-gradient(circle at 28% 58%, rgba(255,229,0,0.42), rgba(255,229,0,0.14) 24%, rgba(255,229,0,0.03) 54%, transparent 72%)",
                "radial-gradient(circle at 72% 18%, rgba(255,244,171,0.94), rgba(255,229,0,0.22) 34%, rgba(255,229,0,0.04) 63%, transparent 79%)",
                "radial-gradient(circle at 88% 82%, rgba(255,229,0,0.2), rgba(255,229,0,0.03) 42%, transparent 66%)",
              ].join(", "),
              filter: "blur(2px)",
            }}
          />
          <div
            aria-hidden
            className="absolute right-[5%] top-[12%] hidden h-48 w-48 rounded-full border border-[#ffe500]/12 bg-[#fff8b7]/24 blur-3xl md:block"
          />
          <div
            aria-hidden
            className="absolute bottom-[-18%] right-[20%] hidden h-44 w-44 rounded-full bg-[#ffe500]/8 blur-[72px] md:block"
          />
          <div className="relative max-w-[48rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#231f20]/52">
              {navItem.description}
            </p>
            <h2
              className="mt-3 text-[2rem] font-semibold uppercase leading-none tracking-[0.08em] md:text-[2.6rem]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              {navItem.label}
            </h2>
            <p className="mt-4 max-w-[58ch] text-sm leading-6 text-[#231f20]/74 md:text-[15px]">
              {meta.description}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {HERO_METRICS[section].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[16px] border border-[#231f20]/12 bg-white/82 px-4 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
                    {metric.label}
                  </p>
                  <p
                    className="mt-2 text-lg font-semibold uppercase tracking-[0.08em]"
                    style={{ fontFamily: "var(--font-admin-mono)" }}
                  >
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel tone="dark">
        <div className="border-b border-white/12 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">
            Signal rail
          </p>
          <div className="mt-3 flex items-center gap-3">
            <StatusBadge label={meta.railValue} />
            <span className="text-sm text-white/76">{meta.railLabel}</span>
          </div>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="rounded-[18px] border border-white/12 bg-white/6 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/56">
              layout stack
            </p>
            <ul className="mt-3 space-y-3 text-sm text-white/86">
              <li>sidebar fixa no desktop</li>
              <li>top bar compacta no mobile</li>
              <li>cards compactos e divisorias marcadas</li>
            </ul>
          </div>
          <div className="rounded-[18px] border border-white/12 bg-white/6 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/56">
              phase scope
            </p>
            <p className="mt-3 text-sm leading-6 text-white/82">
              Mock data consistente, superficies prontas para Chart.js, tabelas densas, upload
              visual e previews de drawer/modal.
            </p>
          </div>
        </div>
      </Panel>
    </section>
  );
}
