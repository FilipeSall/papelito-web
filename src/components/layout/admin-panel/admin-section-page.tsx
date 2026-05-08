import Image from "next/image";

import { ADMIN_NAV_ITEMS, type AdminSectionKey } from "./admin-config";

type PanelProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "muted" | "dark";
};

type MetricCardProps = {
  detail: string;
  label: string;
  tone?: "default" | "warning";
  value: string;
};

type EmptyStateCardProps = {
  body: string;
  label: string;
  title: string;
};

type TableProps = {
  headers: string[];
  rows: React.ReactNode[][];
};

const HERO_METRICS: Record<AdminSectionKey, Array<{ label: string; value: string }>> = {
  overview: [
    { label: "receita 30d", value: "R$ 184k" },
    { label: "pedidos ativos", value: "428" },
    { label: "assets live", value: "12" },
  ],
  sales: [
    { label: "ticket medio", value: "R$ 121" },
    { label: "repique", value: "+18.4%" },
    { label: "sla expedicao", value: "91%" },
  ],
  products: [
    { label: "sku live", value: "214" },
    { label: "estoque critico", value: "09" },
    { label: "promocoes", value: "27" },
  ],
  "flash-sale": [
    { label: "campanha live", value: "01" },
    { label: "janela", value: "48h" },
    { label: "produtos no slot", value: "08" },
  ],
  vendors: [
    { label: "triagens", value: "19" },
    { label: "aprovacao media", value: "6h" },
    { label: "faixas cep", value: "31" },
  ],
  reports: [
    { label: "consultas", value: "14" },
    { label: "fila xlsx", value: "03" },
    { label: "ultimo build", value: "12m" },
  ],
  assets: [
    { label: "banners", value: "07" },
    { label: "uploads", value: "23" },
    { label: "slots hero", value: "05" },
  ],
};

const SECTION_META: Record<
  AdminSectionKey,
  {
    description: string;
    eyebrow: string;
    railLabel: string;
    railValue: string;
    signalTone: "default" | "warning";
  }
> = {
  overview: {
    eyebrow: "Pulse operacional",
    description:
      "Painel base para leitura rapida da operacao: receitas, pedidos, campanhas, fila de vendors e blocos de status preparados para plugar APIs reais.",
    railLabel: "health",
    railValue: "stable",
    signalTone: "default",
  },
  sales: {
    eyebrow: "Receita e pedidos",
    description:
      "Espaco para analytics densos: linha de receita, volume por status, filtros de periodo e leaderboard comercial com densidade tecnica.",
    railLabel: "janela",
    railValue: "M-30",
    signalTone: "default",
  },
  products: {
    eyebrow: "Catalogo operacional",
    description:
      "Camada inicial para tabela densa de SKU, filtros, gatilhos de estoque e preview visual de drawers de edicao.",
    railLabel: "alerts",
    railValue: "09 low stock",
    signalTone: "warning",
  },
  "flash-sale": {
    eyebrow: "Campanha tatica",
    description:
      "Superficie de controle para uma unica campanha ativa com grade de produtos, timing, label promocional e preview de modal.",
    railLabel: "status",
    railValue: "armed",
    signalTone: "default",
  },
  vendors: {
    eyebrow: "Triagem e cobertura",
    description:
      "Leitura de fila, aprovacoes e blocos de cobertura por CEP para operar sellers sem misturar a linguagem do site publico.",
    railLabel: "backlog",
    railValue: "19 entries",
    signalTone: "warning",
  },
  reports: {
    eyebrow: "Consultas versionadas",
    description:
      "Catalogo fechado de relatorios, fila de exportacao XLSX e placeholders preparados para navegacao por presets.",
    railLabel: "exports",
    railValue: "03 queued",
    signalTone: "warning",
  },
  assets: {
    eyebrow: "Home assets",
    description:
      "Area de upload, preview e ordenacao de banners com blocos visuais para estados vazios, historico e drawers futuros.",
    railLabel: "library",
    railValue: "23 files",
    signalTone: "default",
  },
};

const KPI_CARDS = [
  { label: "GMV projetado", value: "R$ 184.240", detail: "+12.6% vs semana passada", tone: "default" as const },
  { label: "Pedidos em fluxo", value: "428", detail: "61 aguardando faturamento", tone: "default" as const },
  { label: "Margem promo", value: "18.2%", detail: "Oferta Relampago em 2 canais", tone: "default" as const },
  { label: "Alertas operacionais", value: "09", detail: "4 SKUs sem buffer", tone: "warning" as const },
];

const SALES_KPIS = [
  { label: "Receita bruta", value: "R$ 92.880", detail: "Madrugada puxada por kits", tone: "default" as const },
  { label: "Pedidos aprovados", value: "311", detail: "Taxa de aprovacao 94%", tone: "default" as const },
  { label: "Chargeback risk", value: "1.1%", detail: "Abaixo da meta interna", tone: "default" as const },
  { label: "Pedidos atrasados", value: "17", detail: "Concentrados em SP capital", tone: "warning" as const },
];

const PRODUCT_TABLE_ROWS = [
  ["Brown KS 50", "SEDA-BRKS50", badge("live"), "R$ 8,90", "72 cx", "Alta saida"],
  ["Slim Longa", "SEDA-SLON", badge("live"), "R$ 12,40", "18 cx", "Reposicao"],
  ["Filtro Bio", "FIL-BIO", badge("draft"), "R$ 6,20", "04 cx", "Buffer critico"],
  ["Kit Premium", "KIT-PREM", badge("paused"), "R$ 39,90", "31 un", "Campanha"],
];

const RECENT_ORDER_ROWS = [
  ["#8451", "Premium + Brown", badge("paid"), "R$ 182,40", "08:14"],
  ["#8450", "Display Slim", badge("packing"), "R$ 96,00", "08:06"],
  ["#8448", "Oferta Relampago", badge("queued"), "R$ 251,90", "07:58"],
  ["#8443", "Filtros Bio", badge("review"), "R$ 74,80", "07:46"],
];

const SALES_LEADERBOARD_ROWS = [
  ["Marketplace direto", "R$ 39.240", "+14.2%", "34%"],
  ["Whatsapp B2B", "R$ 28.114", "+8.1%", "22%"],
  ["Site / kits", "R$ 15.908", "+31.4%", "18%"],
  ["Oferta Relampago", "R$ 9.870", "+61.3%", "11%"],
];

const FLASH_SALE_ROWS = [
  ["Ultra Longa", "SKU-FUNUL", "R$ 8,20", "R$ 6,90", badge("live")],
  ["Slim Com Piteira", "SKU-SLCP", "R$ 9,90", "R$ 8,10", badge("ready")],
  ["Brown Longa", "SKU-BRLO", "R$ 11,50", "R$ 9,90", badge("queued")],
  ["Display Hemp", "SKU-HEMP", "R$ 13,20", "R$ 11,20", badge("draft")],
];

const VENDOR_ROWS = [
  ["Headshop Centro", "Curitiba / PR", badge("review"), "2h", "00000-000 -> 19999-999"],
  ["Tabacaria Norte", "Manaus / AM", badge("queued"), "5h", "69000-000 -> 69299-999"],
  ["Boutique Rua 9", "Goiania / GO", badge("approved"), "1d", "74000-000 -> 74899-999"],
  ["Loja Ponto 21", "Campinas / SP", badge("rejected"), "3d", "13000-000 -> 13199-999"],
];

const REPORT_ROWS = [
  ["Usuarios cadastrados v3", "Clientes", "XLSX", badge("ready"), "2 colunas chave"],
  ["Receita por janela", "Financeiro", "CSV + chart", badge("live"), "Padrao board"],
  ["Pedidos por CEP", "Logistica", "XLSX", badge("queued"), "Aguardando build"],
  ["Vendors aprovados", "Operacao", "XLSX", badge("draft"), "Em revisao"],
];

const ASSET_ROWS = [
  ["hero-primary.png", "Hero desktop", badge("live"), "1920x840", "ordem 01"],
  ["hero-mobile-02.png", "Hero mobile", badge("ready"), "720x960", "ordem 02"],
  ["flash-card.webp", "Oferta", badge("draft"), "1280x720", "sem href"],
  ["vendors-banner.png", "Vendors", badge("paused"), "1440x540", "aguardando crop"],
];

function badge(status: string) {
  return <StatusBadge label={status} />;
}

function panelClassName(tone: PanelProps["tone"], className?: string) {
  const toneClassName =
    tone === "dark"
      ? "bg-[#231f20] text-[#f5f1e8]"
      : tone === "muted"
        ? "bg-[#f7f2e7] text-[#231f20]"
        : "bg-[#fbf7ef] text-[#231f20]";

  return [
    "rounded-[20px] border-2 border-[#231f20] shadow-[8px_8px_0_rgba(35,31,32,0.08)]",
    toneClassName,
    className ?? "",
  ].join(" ");
}

function Panel({ children, className, tone = "default" }: PanelProps) {
  return <section className={panelClassName(tone, className)}>{children}</section>;
}

function StatusBadge({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  const tone =
    normalized === "warning" ||
    normalized === "review" ||
    normalized === "draft" ||
    normalized === "queued"
      ? "warning"
      : normalized === "rejected" || normalized === "paused"
        ? "critical"
        : "default";

  const className =
    tone === "default"
      ? "border-[#231f20]/14 bg-[#231f20] text-[#ffe500]"
      : tone === "warning"
        ? "border-[#231f20]/14 bg-[#ffe500] text-[#231f20]"
        : "border-[#231f20]/20 bg-[#d9d3c6] text-[#231f20]";

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
        className,
      ].join(" ")}
      style={{ fontFamily: "var(--font-admin-mono)" }}
    >
      {label}
    </span>
  );
}

function SectionHeader({ section }: { section: AdminSectionKey }) {
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

function MetricCard({ detail, label, tone = "default", value }: MetricCardProps) {
  return (
    <Panel className="overflow-hidden">
      <div
        className={[
          "h-1.5 w-full",
          tone === "warning" ? "bg-[#ffe500]" : "bg-[#231f20]",
        ].join(" ")}
      />
      <div className="px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/44">
          {label}
        </p>
        <p
          className="mt-3 text-[2rem] font-semibold uppercase leading-none tracking-[0.06em]"
          style={{ fontFamily: "var(--font-admin-display)" }}
        >
          {value}
        </p>
        <p className="mt-3 text-sm leading-6 text-[#231f20]/68">{detail}</p>
      </div>
    </Panel>
  );
}

function FilterBar({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={item}
          className={[
            "inline-flex min-h-10 items-center rounded-[14px] border px-3 text-sm font-semibold uppercase tracking-[0.14em]",
            index === 0
              ? "border-[#231f20] bg-[#231f20] text-[#ffe500]"
              : "border-[#231f20]/16 bg-white/76 text-[#231f20]/72",
          ].join(" ")}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CompactTable({ headers, rows }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="border-b border-[#231f20]/12 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${headers[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className="border-b border-[#231f20]/8 px-4 py-3 text-sm text-[#231f20]/78"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LineChartPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-[18px] border border-[#231f20]/12 bg-white/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
          {label}
        </p>
        <StatusBadge label="chart.js slot" />
      </div>
      <div className="relative mt-5 h-52 overflow-hidden rounded-[16px] border border-[#231f20]/12 bg-[#f3efe4]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "linear-gradient(to right, rgba(35,31,32,0.08) 1px, transparent 1px)",
              "linear-gradient(to bottom, rgba(35,31,32,0.08) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "48px 100%, 100% 36px",
          }}
        />
        <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 600 240">
          <path
            d="M20 188C83 172 112 98 171 116C233 136 257 44 328 68C396 90 420 186 478 174C526 165 547 116 580 92"
            stroke="#231F20"
            strokeLinecap="square"
            strokeWidth="4"
          />
          <path
            d="M20 188C83 172 112 98 171 116C233 136 257 44 328 68C396 90 420 186 478 174C526 165 547 116 580 92"
            stroke="#FFE500"
            strokeDasharray="8 10"
            strokeLinecap="square"
            strokeWidth="10"
          />
        </svg>
      </div>
    </div>
  );
}

function BarChartPlaceholder({ label }: { label: string }) {
  const bars = [62, 84, 45, 98, 54, 76, 39];

  return (
    <div className="rounded-[18px] border border-[#231f20]/12 bg-white/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
          {label}
        </p>
        <StatusBadge label="status mix" />
      </div>
      <div className="mt-5 flex h-52 items-end gap-3 rounded-[16px] border border-[#231f20]/12 bg-[#f3efe4] px-4 py-4">
        {bars.map((height, index) => (
          <div key={height} className="flex flex-1 flex-col justify-end gap-2">
            <div
              className={[
                "rounded-t-[10px] border border-[#231f20]",
                index % 2 === 0 ? "bg-[#231f20]" : "bg-[#ffe500]",
              ].join(" ")}
              style={{ height: `${height}%` }}
            />
            <span
              className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[#231f20]/44"
              style={{ fontFamily: "var(--font-admin-mono)" }}
            >
              d{index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChartPlaceholder() {
  return (
    <div className="rounded-[18px] border border-[#231f20]/12 bg-white/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
          mix / concentracao
        </p>
        <StatusBadge label="doughnut" />
      </div>
      <div className="mt-5 flex items-center gap-6 rounded-[16px] border border-[#231f20]/12 bg-[#f3efe4] p-4">
        <div className="relative h-36 w-36 rounded-full border-2 border-[#231f20] bg-[conic-gradient(#231f20_0_38%,#ffe500_38%_67%,#c8c1b3_67%_100%)]">
          <div className="absolute inset-5 rounded-full border-2 border-[#231f20] bg-[#fbf7ef]" />
        </div>
        <div className="space-y-3 text-sm text-[#231f20]/72">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[#231f20]" />
            linha premium 38%
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[#ffe500]" />
            linha core 29%
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[#c8c1b3]" />
            cauda longa 33%
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingStateCard() {
  return (
    <Panel>
      <div className="border-b border-[#231f20]/10 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
          loading state
        </p>
      </div>
      <div className="space-y-4 px-5 py-5">
        <div className="h-4 w-28 animate-pulse rounded-full bg-[#231f20]/12" />
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-[14px] bg-[#231f20]/10" />
          <div className="h-10 animate-pulse rounded-[14px] bg-[#231f20]/8" />
          <div className="h-20 animate-pulse rounded-[18px] bg-[#231f20]/12" />
        </div>
        <p className="text-sm leading-6 text-[#231f20]/64">
          Estado visual para sincronizacao de analytics, imports e preloads do painel.
        </p>
      </div>
    </Panel>
  );
}

function EmptyStateCard({ body, label, title }: EmptyStateCardProps) {
  return (
    <Panel tone="muted">
      <div className="flex h-full flex-col justify-between gap-6 px-5 py-5">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-dashed border-[#231f20]/28 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/46">
          {label}
        </div>
        <div>
          <h3
            className="text-xl font-semibold uppercase tracking-[0.08em]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            {title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#231f20]/68">{body}</p>
        </div>
      </div>
    </Panel>
  );
}

function DrawerPreview() {
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-[#231f20]/10 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
          drawer preview
        </p>
      </div>
      <div className="grid min-h-[19rem] gap-0 md:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-[#231f20]/10 bg-[#f7f2e7] p-5 md:border-b-0 md:border-r">
          <div className="space-y-3">
            <div className="h-10 rounded-[14px] border border-[#231f20]/12 bg-white/82 px-4 py-3 text-sm text-[#231f20]/44">
              Nome do item
            </div>
            <div className="h-10 rounded-[14px] border border-[#231f20]/12 bg-white/82 px-4 py-3 text-sm text-[#231f20]/44">
              SKU / slug / estoque
            </div>
            <div className="h-28 rounded-[18px] border border-[#231f20]/12 bg-white/82 px-4 py-3 text-sm text-[#231f20]/44">
              Descricao compacta e campos da campanha
            </div>
          </div>
        </div>
        <div className="bg-[#231f20] p-5 text-[#f5f1e8]">
          <div className="flex items-center justify-between gap-3">
            <p
              className="text-lg font-semibold uppercase tracking-[0.08em]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              Drawer lateral
            </p>
            <StatusBadge label="future action" />
          </div>
          <p className="mt-3 text-sm leading-6 text-white/82">
            Estrutura visual para editar produto, aprovar vendor ou configurar banner sem trocar
            de contexto.
          </p>
          <div className="mt-6 space-y-3">
            <div className="rounded-[14px] border border-white/12 bg-white/6 px-4 py-3 text-sm text-white/84">
              resumo lateral
            </div>
            <div className="rounded-[14px] border border-white/12 bg-white/6 px-4 py-3 text-sm text-white/84">
              historico rapido
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ModalPreview() {
  return (
    <Panel className="overflow-hidden" tone="dark">
      <div className="border-b border-white/12 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/56">
          modal preview
        </p>
      </div>
      <div className="grid min-h-[19rem] place-items-center bg-[linear-gradient(135deg,rgba(255,229,0,0.14),rgba(255,229,0,0.02))] p-5">
        <div className="w-full max-w-md rounded-[22px] border border-white/12 bg-[#f7f2e7] p-5 text-[#231f20] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/46">
            confirmacao
          </p>
          <h3
            className="mt-3 text-2xl font-semibold uppercase leading-none tracking-[0.08em]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Publicar mudanca
          </h3>
          <p className="mt-4 text-sm leading-6 text-[#231f20]/68">
            Preview de modal para publicar uma campanha, aprovar vendor ou trocar a ordem dos
            banners da home.
          </p>
          <div className="mt-6 flex gap-3">
            <button className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[14px] border-2 border-[#231f20] bg-[#231f20] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#ffe500]">
              Confirmar
            </button>
            <button className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[14px] border-2 border-[#231f20] bg-transparent px-4 text-sm font-semibold uppercase tracking-[0.18em]">
              Revisar
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function UploadSurface() {
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-[#231f20]/10 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
          upload / preview
        </p>
      </div>
      <div className="grid gap-4 p-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[18px] border-2 border-dashed border-[#231f20]/22 bg-[#f7f2e7] p-5">
          <p
            className="text-lg font-semibold uppercase tracking-[0.08em]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Arraste banners aqui
          </p>
          <p className="mt-3 text-sm leading-6 text-[#231f20]/68">
            Slot preparado para upload de hero desktop, mobile e assets de campanha com preview
            imediato antes da integracao real com `wp/v2/media`.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[14px] border border-[#231f20]/12 bg-white/82 px-4 py-3 text-sm text-[#231f20]/48">
              Dropzone / progress / validacao
            </div>
            <div className="rounded-[14px] border border-[#231f20]/12 bg-white/82 px-4 py-3 text-sm text-[#231f20]/48">
              Href de destino / alt / ordem / status
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-[18px] border border-[#231f20]/12 bg-white/85">
            <div className="border-b border-[#231f20]/10 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
              hero desktop
            </div>
            <Image
              alt="Preview do banner principal"
              className="h-44 w-full object-cover"
              height={320}
              src="/images/banner-default.png"
              width={640}
            />
          </div>
          <div className="overflow-hidden rounded-[18px] border border-[#231f20]/12 bg-white/85">
            <div className="border-b border-[#231f20]/10 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
              asset fallback
            </div>
            <Image
              alt="Preview do asset secundario"
              className="h-44 w-full object-cover"
              height={320}
              src="/images/products/product-placeholder.png"
              width={640}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function OverviewContent() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <Panel className="p-5">
          <LineChartPlaceholder label="receita por janela" />
        </Panel>
        <Panel className="p-5" tone="dark">
          <div className="flex items-center justify-between gap-3">
            <h3
              className="text-xl font-semibold uppercase tracking-[0.08em]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              Alertas da operacao
            </h3>
            <StatusBadge label="09 open" />
          </div>
          <div className="mt-5 space-y-3">
            {[
              "Filtro Bio abaixo do buffer ideal em 2 CDs",
              "Campanha relampago vence em 11h 24m",
              "Exportacao de sellers aguardando confirmacao",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[16px] border border-white/12 bg-white/6 px-4 py-3 text-sm leading-6 text-white/86"
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-[#231f20]/10 px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
                pedidos recentes
              </p>
              <p className="mt-1 text-sm text-[#231f20]/66">Tabela densa pronta para filtros.</p>
            </div>
            <FilterBar items={["Hoje", "Aprovados", "Expedicao"]} />
          </div>
          <CompactTable
            headers={["pedido", "cesta", "status", "valor", "hora"]}
            rows={RECENT_ORDER_ROWS}
          />
        </Panel>

        <Panel className="p-5">
          <div className="rounded-[18px] border border-[#231f20]/12 bg-[#231f20] p-4 text-[#f5f1e8]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/56">
              oferta relampago
            </p>
            <p
              className="mt-3 text-2xl font-semibold uppercase tracking-[0.08em]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              Giro hemp week
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["starts 10:00", "ends 23:59", "08 SKUs"].map((item) => (
                <div key={item} className="rounded-[14px] border border-white/12 bg-white/6 px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/84">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[18px] border border-[#231f20]/12 bg-white/82 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
              fila vendors
            </p>
            <div className="mt-4 space-y-3">
              {[
                ["Headshop Centro", "review"],
                ["Tabacaria Norte", "queued"],
                ["Boutique Rua 9", "approved"],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-[14px] border border-[#231f20]/10 px-3 py-3">
                  <span className="text-sm text-[#231f20]/74">{label}</span>
                  <StatusBadge label={status} />
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <LoadingStateCard />
        <EmptyStateCard
          label="empty"
          title="Sem segundo slot de campanha"
          body="Estado vazio pronto para quando ainda nao existir campanha secundaria, aprovacao ou nova biblioteca de banners."
        />
        <ModalPreview />
      </div>
    </>
  );
}

function SalesContent() {
  return (
    <>
      <FilterBar items={["30 dias", "Receita", "Pedidos", "Canal", "Comparar periodo"]} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SALES_KPIS.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="p-5">
          <LineChartPlaceholder label="receita / ticket medio" />
        </Panel>
        <Panel className="p-5">
          <BarChartPlaceholder label="pedidos por status" />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-[#231f20]/10 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              leaderboard comercial
            </p>
          </div>
          <CompactTable
            headers={["canal", "receita", "delta", "share"]}
            rows={SALES_LEADERBOARD_ROWS}
          />
        </Panel>
        <Panel className="p-5">
          <DonutChartPlaceholder />
        </Panel>
      </div>
    </>
  );
}

function ProductsContent() {
  return (
    <>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterBar items={["Todos", "Live", "Promo", "Estoque baixo", "Categoria"]} />
        <div className="flex gap-2">
          <button className="inline-flex min-h-11 items-center rounded-[14px] border-2 border-[#231f20] bg-transparent px-4 text-sm font-semibold uppercase tracking-[0.16em]">
            Importar
          </button>
          <button className="inline-flex min-h-11 items-center rounded-[14px] border-2 border-[#231f20] bg-[#231f20] px-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#ffe500]">
            Novo produto
          </button>
        </div>
      </div>
      <Panel className="overflow-hidden">
        <div className="border-b border-[#231f20]/10 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
            catalogo denso
          </p>
        </div>
        <CompactTable
          headers={["produto", "sku", "status", "preco", "estoque", "nota"]}
          rows={PRODUCT_TABLE_ROWS}
        />
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DrawerPreview />
        <div className="grid gap-4">
          <EmptyStateCard
            label="zero"
            title="Nenhum filtro aplicado"
            body="O estado vazio cobre pesquisas sem retorno, categorias sem SKU e galerias ainda nao associadas ao produto."
          />
          <LoadingStateCard />
        </div>
      </div>
    </>
  );
}

function FlashSaleContent() {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-5" tone="dark">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/56">
            campanha ativa
          </p>
          <h3
            className="mt-3 text-[2.3rem] font-semibold uppercase leading-none tracking-[0.08em]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Giro hemp week
          </h3>
          <p className="mt-4 max-w-[40ch] text-sm leading-6 text-white/82">
            Labels, supporting text, janela ativa e grade de produtos preparados com mock data para
            depois plugar o dominio `papelito/v1`.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "starts", value: "08/05 10:00" },
              { label: "ends", value: "10/05 23:59" },
              { label: "label", value: "flash bundle" },
            ].map((item) => (
              <div key={item.label} className="rounded-[16px] border border-white/12 bg-white/6 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/56">
                  {item.label}
                </p>
                <p
                  className="mt-2 text-sm font-semibold uppercase tracking-[0.08em]"
                  style={{ fontFamily: "var(--font-admin-mono)" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <BarChartPlaceholder label="janela / pressao promocional" />
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-[#231f20]/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              grade de produtos
            </p>
            <p className="mt-1 text-sm text-[#231f20]/64">Tabela mockada para associacao da campanha.</p>
          </div>
          <FilterBar items={["Ativos", "Candidatos", "Margem", "Categoria"]} />
        </div>
        <CompactTable
          headers={["produto", "sku", "preco base", "preco promo", "status"]}
          rows={FLASH_SALE_ROWS}
        />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ModalPreview />
        <EmptyStateCard
          label="slot"
          title="Sem campanha secundaria"
          body="O v1 assume uma campanha ativa por vez. Este estado vazio deixa claro quando o segundo slot ainda nao existe."
        />
      </div>
    </>
  );
}

function VendorsContent() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Fila aberta", value: "19", detail: "07 aguardando leitura", tone: "warning" as const },
          { label: "Aprovados no dia", value: "06", detail: "Pico em Curitiba e Goiania", tone: "default" as const },
          { label: "Faixas CEP", value: "31", detail: "08 em revisao de cobertura", tone: "default" as const },
          { label: "Risco de overlap", value: "02", detail: "Faixas precisam merge", tone: "warning" as const },
        ].map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
      <Panel className="overflow-hidden">
        <div className="border-b border-[#231f20]/10 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
            triagem de vendors
          </p>
        </div>
        <CompactTable
          headers={["vendor", "cidade", "status", "espera", "faixa"]}
          rows={VENDOR_ROWS}
        />
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel className="p-5">
          <LineChartPlaceholder label="cobertura / cep map" />
        </Panel>
        <LoadingStateCard />
      </div>
    </>
  );
}

function ReportsContent() {
  return (
    <>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterBar items={["Todos", "Clientes", "Operacao", "XLSX", "Versionados"]} />
        <button className="inline-flex min-h-11 items-center rounded-[14px] border-2 border-[#231f20] bg-[#231f20] px-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#ffe500]">
          Novo preset
        </button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-[#231f20]/10 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              catalogo de relatorios
            </p>
          </div>
          <CompactTable
            headers={["relatorio", "area", "saida", "status", "nota"]}
            rows={REPORT_ROWS}
          />
        </Panel>
        <Panel className="p-5">
          <DonutChartPlaceholder />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <LoadingStateCard />
        <EmptyStateCard
          label="sql"
          title="Sem consulta custom aprovada"
          body="Estado pronto para quando o catalogo ainda nao tiver uma query liberada para exportacao versionada."
        />
      </div>
    </>
  );
}

function AssetsContent() {
  return (
    <>
      <UploadSurface />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-[#231f20]/10 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              biblioteca visual
            </p>
          </div>
          <CompactTable
            headers={["arquivo", "slot", "status", "size", "obs"]}
            rows={ASSET_ROWS}
          />
        </Panel>
        <DrawerPreview />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <EmptyStateCard
          label="hero"
          title="Nenhum banner extra cadastrado"
          body="Estado vazio preparado para home sem banners secundarios ou para uma nova secao ainda nao ativada."
        />
        <LoadingStateCard />
      </div>
    </>
  );
}

function renderSection(section: AdminSectionKey) {
  switch (section) {
    case "overview":
      return <OverviewContent />;
    case "sales":
      return <SalesContent />;
    case "products":
      return <ProductsContent />;
    case "flash-sale":
      return <FlashSaleContent />;
    case "vendors":
      return <VendorsContent />;
    case "reports":
      return <ReportsContent />;
    case "assets":
      return <AssetsContent />;
    default:
      return null;
  }
}

export function AdminSectionPage({ section }: { section: AdminSectionKey }) {
  return (
    <div className="space-y-4 md:space-y-5">
      <SectionHeader section={section} />
      {renderSection(section)}
    </div>
  );
}
