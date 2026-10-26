/** Extensões aceitas pelo seletor de arquivo; o WordPress repete a checagem pelo conteúdo. */
export const PRODUCT_IMPORT_ACCEPT = ".csv,.xlsx";

/** Teto do arquivo, o mesmo do leitor de planilhas compartilhado com a importação do vendor. */
export const PRODUCT_IMPORT_MAX_BYTES = 2 * 1024 * 1024;

/** Teto de linhas de produto por arquivo, imposto pelo WordPress na leitura. */
export const PRODUCT_IMPORT_MAX_ROWS = 2000;

/**
 * Situação de uma linha na prévia, decidida pelo WordPress.
 * `duplicado` só entra se o admin pedir; `repetida` e `erro` nunca entram.
 */
export const PRODUCT_IMPORT_STATUSES = ["novo", "incompleto", "duplicado", "repetida", "erro"] as const;

/** Situação de uma linha da planilha. */
export type ProductImportStatus = (typeof PRODUCT_IMPORT_STATUSES)[number];

/** Problema encontrado numa linha; `error` barra, `warn` deixa entrar com ressalva. */
export type ProductImportIssue = {
  field: string;
  level: "error" | "warn" | "info";
  message: string;
};

/** Produto do catálogo que já tem o mesmo nome na mesma categoria. */
export type ProductImportExisting = {
  id: number;
  sku: string;
  name: string;
};

/** Linha analisada da prévia, com as células cruas para o relatório de erros. */
export type ProductImportRow = {
  line: number;
  cells: string[];
  name: string;
  category: { slug: string; name: string } | null;
  subcategories: string[];
  price: number | null;
  salePrice: number | null;
  incomplete: boolean;
  status: ProductImportStatus;
  issues: ProductImportIssue[];
  repeatOf: number | null;
  duplicateOf: ProductImportExisting | null;
};

/** Contagem por situação devolvida pelo WordPress. */
export type ProductImportSummary = Record<ProductImportStatus, number> & { total: number };

/** Lote anterior que já importou o mesmo arquivo. */
export type ProductImportPreviousLot = {
  lot: string;
  at: string;
  created: number;
};

/** Cabeçalho do arquivo e a coluna do modelo para onde cada um vai (null quando é ignorado). */
export type ProductImportColumn = {
  header: string;
  field: string | null;
};

/** Prévia completa: nada foi gravado ainda; o `token` é o que a confirmação reenvia. */
export type ProductImportPreview = {
  token: string;
  fileName: string;
  headers: string[];
  columns: ProductImportColumn[];
  alreadyImported: ProductImportPreviousLot | null;
  summary: ProductImportSummary;
  rows: ProductImportRow[];
};

/** Produto criado pelo lote, já com o SKU gerado. */
export type ProductImportCreated = {
  line: number;
  productId: number;
  sku: string;
  name: string;
  incomplete: boolean;
};

/** Linha que ficou de fora do lote, com o motivo. */
export type ProductImportLeftOut = {
  line: number;
  name: string;
  status: ProductImportStatus;
  issues: ProductImportIssue[];
};

/** Resultado da confirmação: o lote entrou inteiro. */
export type ProductImportResult = {
  lot: string;
  operationId: number;
  created: ProductImportCreated[];
  ignored: ProductImportLeftOut[];
  errors: ProductImportLeftOut[];
};

/** Decisões que a confirmação leva ao WordPress; as linhas nunca voltam do navegador. */
export type ProductImportConfirmation = {
  token: string;
  createLines: number[];
  acknowledgeRepeat: boolean;
};

/** Recusa da leitura por falta de colunas obrigatórias, com o cabeçalho que foi lido. */
export type ProductImportMissingColumns = {
  missing: string[];
  columns: ProductImportColumn[];
};

/** Coluna do modelo CSV oferecido para download. */
export type ProductImportTemplateColumn = {
  key: string;
  label: string;
  rule: string;
  requirement: "obrigatoria" | "frete" | "opcional";
};

/**
 * Colunas do modelo, na ordem do arquivo de exemplo. Espelha `papelito_product_import_columns()`
 * no WordPress, que é quem decide; aqui serve só para o modelo e a ajuda da tela.
 */
export const PRODUCT_IMPORT_TEMPLATE_COLUMNS: readonly ProductImportTemplateColumn[] = [
  { key: "nome", label: "Nome", requirement: "obrigatoria", rule: "Como aparece na vitrine." },
  { key: "categoria", label: "Categoria", requirement: "obrigatoria", rule: "Slug ou nome: sedas, piteiras, filtros, acessorios." },
  { key: "subcategorias", label: "Subcategorias", requirement: "opcional", rule: "Da mesma categoria, separadas por |." },
  { key: "preco_regular", label: "Preço regular", requirement: "obrigatoria", rule: "Maior que zero. Aceita 84,90." },
  { key: "preco_promocional", label: "Preço promocional", requirement: "opcional", rule: "Menor que o regular." },
  { key: "peso_kg", label: "Peso (kg)", requirement: "frete", rule: "400 g = 0,4." },
  { key: "comprimento_cm", label: "Comprimento (cm)", requirement: "frete", rule: "Medida da embalagem." },
  { key: "largura_cm", label: "Largura (cm)", requirement: "frete", rule: "Medida da embalagem." },
  { key: "altura_cm", label: "Altura (cm)", requirement: "frete", rule: "Medida da embalagem." },
  { key: "descricao_curta", label: "Descrição curta", requirement: "opcional", rule: "Texto da vitrine." },
  { key: "descricao", label: "Descrição longa", requirement: "opcional", rule: "Texto da página do produto." },
  { key: "colecoes", label: "Coleções", requirement: "opcional", rule: "Coleção manual ativa, ex.: premium." },
  { key: "tags", label: "Tags", requirement: "opcional", rule: "Separadas por |; tag nova é criada." },
];

/**
 * Linhas de exemplo do modelo, na ordem de `PRODUCT_IMPORT_TEMPLATE_COLUMNS`. Aparecem no
 * download do modelo e no exemplo da tela — os dois mostram o mesmo arquivo.
 */
export const PRODUCT_IMPORT_EXAMPLE_ROWS: readonly (readonly string[])[] = [
  ["Seda Exemplo King Size Display c/ 50 Livretos", "sedas", "tradicional|king-size", "90,09", "", "0,35", "16", "10", "6", "Texto curto da vitrine.", "", "", "Lançamento"],
  ["Piteira Exemplo Slim Display c/ 25 Livretos", "piteiras", "slim", "46,90", "42,90", "0,20", "14", "9", "5", "Texto curto da vitrine.", "Descrição completa, opcional.", "premium", ""],
  ["Dichavador Exemplo Metal 4 Partes", "acessorios", "dichavador", "39,90", "", "0,12", "6", "6", "5", "", "", "", ""],
];

/** Grupo de palavras que a importação lê como a mesma coisa, para a ajuda da tela. */
export type ProductImportSynonymGroup = {
  where: string;
  examples: readonly { written: string; read: string }[];
};

/**
 * Palavras que a importação entende além do nome exato. Espelha o dicionário da importação do
 * vendor (`papelito_vendor_code_import_dictionary()`), que é quem decide; aqui é só a ajuda.
 */
export const PRODUCT_IMPORT_SYNONYMS: readonly ProductImportSynonymGroup[] = [
  {
    where: "Categoria",
    examples: [
      { written: "seda, filtro, acessório", read: "Sedas, Filtros, Acessórios (singular ou plural)" },
      { written: "triturador, grinder, dichavador", read: "Acessórios › Dichavador" },
      { written: "tubelito, bandeja, cinzeiro", read: "Acessórios › Tubelito, Bandeja, Cinzeiro" },
    ],
  },
  {
    where: "Subcategorias",
    examples: [
      { written: "ks, kingsize", read: "King Size" },
      { written: "ms, mini", read: "Mini Size" },
      { written: "biodegradável", read: "Bio" },
      { written: "mentolado", read: "Mentol" },
      { written: "longo, longa", read: "a mesma subcategoria" },
    ],
  },
  {
    where: "Nome (checagem de “já existe”)",
    examples: [{ written: "Triturador Neon", read: "é o mesmo produto que “Dichavador Neon” na mesma categoria" }],
  },
];
