/** Relatório exportável pela página de Relatórios. */
export type ExportReportKey = "sales" | "users" | "products";

/** Opção de um filtro de escolha, com o valor que a rota do WordPress recebe. */
export type ExportChoiceOption = { label: string; value: string };

/** Filtro de escolha única do relatório; `key` vira o parâmetro da querystring. */
export type ExportChoice = {
  key: string;
  label: string;
  options: readonly ExportChoiceOption[];
};

/** O que a tela precisa saber de um relatório para filtrar, contar e baixar. */
export type ExportReportDefinition = {
  key: ExportReportKey;
  title: string;
  description: string;
  /** Rota de download; a mesma que o dashboard de vendas usava. */
  endpoint: string;
  /** Rota que diz quantas linhas sairiam, antes do download. */
  countEndpoint: string;
  filenamePrefix: string;
  /** Singular e plural do que cada linha é, para "Exportar 42 pedidos pagos". */
  noun: readonly [string, string];
  /** Frase do estado vazio: "Nenhum pedido pago entre…". */
  emptyLead: string;
  /** Recorte por período; o catálogo de produtos não tem. */
  period: { labels: readonly [string, string]; note: string } | null;
  /** Filtros de escolha única, na ordem da tela; o primeiro valor de cada um é o padrão. */
  choices: readonly ExportChoice[];
  /** Linha que explica o recorte quando não há período. */
  scopeNote?: string;
  /** Cabeçalho do arquivo, na ordem em que o WordPress escreve. */
  columns: readonly string[];
};

/**
 * Os relatórios da página: Vendas e Usuários, que saíram do dashboard de Vendas, e o catálogo de
 * Produtos no formato da importação. Filtro, colunas e regra de recorte são do WordPress
 * (`admin_reports.php`, `admin_product_export.php`); esta lista só descreve para a tela.
 */
export const EXPORT_REPORTS: Record<ExportReportKey, ExportReportDefinition> = {
  sales: {
    key: "sales",
    title: "Vendas",
    description: "Pedidos com pagamento confirmado no intervalo, com cliente, contato, endereço de cobrança, forma de pagamento e total.",
    endpoint: "/api/admin/reports/sales/export",
    countEndpoint: "/api/admin/reports/sales/count",
    filenamePrefix: "vendas",
    noun: ["pedido pago", "pedidos pagos"],
    emptyLead: "Nenhum pedido pago",
    period: { labels: ["De", "Até"], note: "Recorta a data do pedido; só entram pedidos com pagamento confirmado." },
    choices: [],
    columns: ["ID", "Número", "Data", "Status", "Cliente", "Telefone", "CEP", "Cidade", "UF", "Pagamento", "Total"],
  },
  users: {
    key: "users",
    title: "Usuários",
    description: "Contas com login, e-mail, telefone, CEP, cidade e estado. Só dado de usuário — nenhum pedido entra neste arquivo.",
    endpoint: "/api/admin/reports/users/export",
    countEndpoint: "/api/admin/reports/users/count",
    filenamePrefix: "usuarios",
    noun: ["conta", "contas"],
    emptyLead: "Nenhuma conta cadastrada",
    period: { labels: ["Cadastro de", "Cadastro até"], note: "Recorta a data de cadastro da conta, não período de venda." },
    columns: ["ID", "Nome", "E-mail", "Role", "Loja", "Telefone", "CNPJ", "Cidade", "Estado", "Cobertura CEP", "Data de cadastro"],
    choices: [
      {
        key: "role",
        label: "Papel",
        options: [
          { label: "Todos", value: "all" },
          { label: "Compradores", value: "customer" },
          { label: "Vendors", value: "seller" },
          { label: "Admins", value: "administrator" },
        ],
      },
    ],
  },
  products: {
    key: "products",
    title: "Produtos",
    description:
      "O catálogo no mesmo formato da importação: dá para editar no Excel e usar de base para cadastrar produtos novos. Kits ficam de fora.",
    endpoint: "/api/admin/reports/products/export",
    countEndpoint: "/api/admin/reports/products/count",
    filenamePrefix: "produtos",
    noun: ["produto", "produtos"],
    emptyLead: "Nenhum produto",
    period: null,
    scopeNote: "sku, status e tipo vão como referência; a importação ignora essas três colunas.",
    choices: [
      {
        key: "status",
        label: "Situação",
        options: [
          { label: "Todos", value: "all" },
          { label: "Publicados", value: "publish" },
          { label: "Rascunhos", value: "draft" },
        ],
      },
    ],
    columns: [
      "sku", "nome", "categoria", "subcategorias", "preco_regular", "preco_promocional", "peso_kg", "comprimento_cm",
      "largura_cm", "altura_cm", "descricao_curta", "descricao", "colecoes", "tags", "status", "tipo",
    ],
  },
};

/**
 * Relatório de produtos com o filtro de categoria montado a partir das categorias ativas.
 * As categorias são dado do WordPress; sem elas, o filtro não aparece.
 */
export function withCategoryChoice(
  definition: ExportReportDefinition,
  categories: ReadonlyArray<{ name: string; slug: string }>,
): ExportReportDefinition {
  if (categories.length === 0) return definition;
  const category: ExportChoice = {
    key: "category",
    label: "Categoria",
    options: [{ label: "Todas", value: "all" }, ...categories.map((item) => ({ label: item.name, value: item.slug }))],
  };
  return { ...definition, choices: [...definition.choices, category] };
}

/** "1 conta" / "27 contas", com milhar no padrão brasileiro. */
export function pluralize(count: number, noun: readonly [string, string]): string {
  return `${count.toLocaleString("pt-BR")} ${count === 1 ? noun[0] : noun[1]}`;
}
