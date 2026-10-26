import { Ban, Check, CircleSlash, Copy, Files, LoaderCircle, TriangleAlert, X } from "lucide-react";

import type { ProductImportRow } from "@/features/admin-product-import/types/admin-product-import";
import type { ReportOperationStatus } from "@/types/admin-report-operations";

import type { StatusShape } from "../../primitives";

/**
 * Selo de uma linha da conferência, já com a decisão do admin: duplicado marcado para criar
 * passa a "Cadastrar mesmo assim".
 */
export function importRowStatus(row: ProductImportRow, chosen: boolean): StatusShape {
  switch (row.status) {
    case "novo":
      return { icon: Check, label: "Entra", tone: "positive" };
    case "incompleto":
      return { icon: TriangleAlert, label: "Entra incompleto", tone: "pending" };
    case "duplicado":
      return chosen
        ? { icon: Check, label: "Cadastrar mesmo assim", tone: "positive" }
        : { icon: Copy, label: "Já existe", tone: "pending" };
    case "repetida":
      return { icon: Files, label: "Repetida", tone: "neutral" };
    default:
      return { icon: X, label: "Com erro", tone: "critical" };
  }
}

/** Selo do desfecho de uma exportação ou lote na Atividade recente. */
export function operationStatus(status: ReportOperationStatus): StatusShape {
  switch (status) {
    case "done":
      return { icon: Check, label: "Concluído", tone: "positive" };
    case "partial":
      return { icon: TriangleAlert, label: "Com pendências", tone: "pending" };
    case "empty":
      return { icon: CircleSlash, label: "Sem dados", tone: "neutral" };
    case "running":
      return { icon: LoaderCircle, label: "Processando", tone: "neutral" };
    default:
      return { icon: Ban, label: "Falhou", tone: "critical" };
  }
}
