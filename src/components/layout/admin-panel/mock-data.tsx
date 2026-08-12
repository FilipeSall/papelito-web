import type { AdminSectionKey } from "./admin-config";
import { badge } from "./primitives";

export const HERO_METRICS: Record<AdminSectionKey, Array<{ label: string; value: string }>> = {
  sales: [
    { label: "ticket médio", value: "R$ 121" },
    { label: "repique", value: "+18.4%" },
    { label: "sla expedição", value: "91%" },
  ],
  products: [
    { label: "sku live", value: "214" },
    { label: "estoque critico", value: "09" },
    { label: "promoções", value: "27" },
  ],
  categories: [
    { label: "categorias", value: "04" },
    { label: "subcategorias", value: "32" },
    { label: "sem classificação", value: "00" },
  ],
  "flash-sale": [
    { label: "campanha live", value: "01" },
    { label: "janela", value: "48h" },
    { label: "produtos no slot", value: "08" },
  ],
  vendors: [
    { label: "vendors", value: "32" },
    { label: "com cobertura", value: "31" },
    { label: "faixas cep", value: "31" },
  ],
  users: [
    { label: "admins", value: "04" },
    { label: "sellers", value: "32" },
    { label: "tickets brutos", value: "17" },
  ],
  suporte: [
    { label: "escaladas", value: "-" },
    { label: "não lidas", value: "-" },
    { label: "sla", value: "-" },
  ],
  coupons: [
    { label: "cupons ativos", value: "-" },
    { label: "tipos", value: "% / R$" },
    { label: "restrições", value: "vendor + produto" },
  ],
  reports: [
    { label: "consultas", value: "14" },
    { label: "fila xlsx", value: "03" },
    { label: "último build", value: "12m" },
  ],
  assets: [
    { label: "banners", value: "07" },
    { label: "uploads", value: "23" },
    { label: "slots hero", value: "05" },
  ],
  config: [
    { label: "segurança", value: "2FA pronto" },
    { label: "última troca", value: "24d" },
    { label: "sessao", value: "ativa" },
  ],
};

export const SECTION_META: Record<
  AdminSectionKey,
  {
    description: string;
    eyebrow: string;
    railLabel: string;
    railValue: string;
    signalTone: "default" | "warning";
  }
> = {
  sales: {
    eyebrow: "Receita e pedidos",
    description:
      "Acompanhe a performance comercial da loja: receita do período, ticket médio, distribuicao de pedidos por status e ranking dos itens mais vendidos no recorte selecionado.",
    railLabel: "janela",
    railValue: "M-30",
    signalTone: "default",
  },
  products: {
    eyebrow: "Catálogo operacional",
    description:
      "Camada inicial para tabela densa de SKU, filtros, gatilhos de estoque e preview visual de drawers de edição.",
    railLabel: "alerts",
    railValue: "09 low stock",
    signalTone: "warning",
  },
  categories: {
    eyebrow: "Taxonomia do catálogo",
    description:
      "Categorias principais e subcategorias da Papelito. Um produto tem exatamente uma categoria principal; as subcategorias se somam por faceta.",
    railLabel: "entidade",
    railValue: "própria",
    signalTone: "default",
  },
  "flash-sale": {
    eyebrow: "Campanha tatica",
    description:
      "Superficie de controle para uma única campanha ativa com grade de produtos, timing, label promocional e preview de modal.",
    railLabel: "status",
    railValue: "armed",
    signalTone: "default",
  },
  vendors: {
    eyebrow: "Contas e cobertura",
    description:
      "Gestão dos vendors efetivamente cadastrados, suas faixas de cobertura, estoque e operação.",
    railLabel: "papel",
    railValue: "seller",
    signalTone: "default",
  },
  users: {
    eyebrow: "Contas e roles",
    description:
      "Leitura administrativa de usuários, pedidos, vendas e transicoes de role, mantendo favoritos e tickets apenas como contadores brutos.",
    railLabel: "recorte",
    railValue: "multi-role",
    signalTone: "default",
  },
  suporte: {
    eyebrow: "Atendimento escalado",
    description: "Conversas de pedidos encaminhadas para acompanhamento da Papelito.",
    railLabel: "fila",
    railValue: "aberta",
    signalTone: "warning",
  },
  coupons: {
    eyebrow: "Engine de cupons",
    description:
      "Cupons percentuais ou de valor fixo, restrições por role, vendor e produto. Suporta notificação de favorito-em-promoção.",
    railLabel: "status",
    railValue: "ativo",
    signalTone: "default",
  },
  reports: {
    eyebrow: "Consultas versionadas",
    description:
      "Catálogo fechado de relatórios, fila de exportação XLSX e placeholders preparados para navegacao por presets.",
    railLabel: "exports",
    railValue: "03 queued",
    signalTone: "warning",
  },
  assets: {
    eyebrow: "Home assets",
    description:
      "Área de upload, preview e ordenacao de banners com blocos visuais para estados vazios, histórico e drawers futuros.",
    railLabel: "library",
    railValue: "23 files",
    signalTone: "default",
  },
  config: {
    eyebrow: "Configurações",
    description:
      "Gerencie sua senha de administrador e ajuste preferências de conta para acesso seguro ao painel.",
    railLabel: "conta",
    railValue: "ativa",
    signalTone: "default",
  },
};

export const KPI_CARDS = [
  { label: "GMV projetado", value: "R$ 184.240", detail: "+12.6% vs semana passada", tone: "default" as const },
  { label: "Pedidos em fluxo", value: "428", detail: "61 aguardando faturamento", tone: "default" as const },
  { label: "Margem promo", value: "18.2%", detail: "Oferta Relâmpago em 2 canais", tone: "default" as const },
  { label: "Alertas operacionais", value: "09", detail: "4 SKUs sem buffer", tone: "warning" as const },
];

export const PRODUCT_TABLE_ROWS = [
  ["Brown KS 50", "SEDA-BRKS50", badge("live"), "R$ 8,90", "72 cx", "Alta saída"],
  ["Slim Longa", "SEDA-SLON", badge("live"), "R$ 12,40", "18 cx", "Reposicao"],
  ["Filtro Bio", "FIL-BIO", badge("draft"), "R$ 6,20", "04 cx", "Buffer critico"],
  ["Kit Premium", "KIT-PREM", badge("paused"), "R$ 39,90", "31 un", "Campanha"],
];

export const RECENT_ORDER_ROWS = [
  ["#8451", "Premium + Brown", badge("paid"), "R$ 182,40", "08:14"],
  ["#8450", "Display Slim", badge("packing"), "R$ 96,00", "08:06"],
  ["#8448", "Oferta Relâmpago", badge("queued"), "R$ 251,90", "07:58"],
  ["#8443", "Filtros Bio", badge("review"), "R$ 74,80", "07:46"],
];

export const FLASH_SALE_ROWS = [
  ["Ultra Longa", "SKU-FUNUL", "R$ 8,20", "R$ 6,90", badge("live")],
  ["Slim Com Piteira", "SKU-SLCP", "R$ 9,90", "R$ 8,10", badge("ready")],
  ["Brown Longa", "SKU-BRLO", "R$ 11,50", "R$ 9,90", badge("queued")],
  ["Display Hemp", "SKU-HEMP", "R$ 13,20", "R$ 11,20", badge("draft")],
];

export const REPORT_ROWS = [
  ["Usuários cadastrados v3", "Clientes", "XLSX", badge("ready"), "2 colunas chave"],
  ["Receita por janela", "Financeiro", "CSV + chart", badge("live"), "Padrão board"],
  ["Pedidos por CEP", "Logística", "XLSX", badge("queued"), "Aguardando build"],
  ["Vendors cadastrados", "Operação", "XLSX", badge("ready"), "Disponível"],
];

export const ASSET_ROWS = [
  ["hero-primary.png", "Hero desktop", badge("live"), "1920x840", "ordem 01"],
  ["hero-mobile-02.png", "Hero mobile", badge("ready"), "720x960", "ordem 02"],
  ["flash-card.webp", "Oferta", badge("draft"), "1280x720", "sem href"],
  ["vendors-banner.png", "Vendors", badge("paused"), "1440x540", "aguardando crop"],
];
