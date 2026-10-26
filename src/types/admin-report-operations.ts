/** Desfecho de uma operação; `running` aberta há mais de uma hora já chega como `failed`. */
export type ReportOperationStatus = "running" | "done" | "partial" | "empty" | "failed";

/** Exportação ou lote de importação registrado pelo WordPress, sem o conteúdo exportado. */
export type ReportOperation = {
  id: number;
  kind: "export" | "import";
  report: string;
  title: string;
  params: Record<string, string>;
  status: ReportOperationStatus;
  rows: number;
  created: number;
  ignored: number;
  errors: number;
  lot: string | null;
  error: string | null;
  at: string;
  byName: string;
};
