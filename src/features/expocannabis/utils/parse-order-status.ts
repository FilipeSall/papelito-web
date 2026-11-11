import type { BuyerLookup, BuyerUpsertResult, EventOrderState, EventOrderStatus } from "../types/order";
import { hasNull, int, isRecord, str } from "./parse-helpers";

const STATES: readonly EventOrderState[] = ["sending", "at_terminal", "paid", "failed", "expired", "canceled", "check_terminal"];

/** Estado do pedido do WordPress, ou `null` com estado desconhecido. */
export function parseOrderStatus(data: unknown): EventOrderStatus | null {
  if (!isRecord(data)) return null;
  const state = STATES.find((item) => item === data.state);
  const method = data.method === "card" || data.method === "pix" ? data.method : "";
  const detail = str(data.detail);
  const totalCents = int(data.totalCents);
  if (!state || detail === null || totalCents === null) return null;
  return {
    orderId: int(data.orderId) ?? 0,
    orderNumber: str(data.orderNumber) ?? "",
    state,
    detail,
    totalCents,
    method,
  };
}

/** Loja da consulta de CNPJ, ou `null` quando malformada. */
export function parseBuyerLookup(data: unknown): BuyerLookup | null {
  if (!isRecord(data) || !isRecord(data.address)) return null;
  const address = data.address;
  const lookup = {
    cnpj: str(data.cnpj),
    legalName: str(data.legalName),
    tradeName: str(data.tradeName),
    address: {
      cep: str(address.cep) ?? "",
      street: str(address.street) ?? "",
      city: str(address.city) ?? "",
      state: str(address.state) ?? "",
      number: str(address.number) ?? "",
      neighborhood: str(address.neighborhood) ?? "",
    },
  };
  if (hasNull([lookup.cnpj, lookup.legalName, lookup.tradeName])) return null;
  return { ...(lookup as Omit<BuyerLookup, "companyId">), companyId: int(data.companyId) };
}

/** Resultado do cadastro rápido, ou `null` quando malformado. */
export function parseBuyerUpsert(data: unknown): BuyerUpsertResult | null {
  if (!isRecord(data) || !isRecord(data.created)) return null;
  const companyId = int(data.companyId);
  const buyerUserId = int(data.buyerUserId);
  if (companyId === null || buyerUserId === null) return null;
  return {
    companyId,
    buyerUserId,
    created: { company: data.created.company === true, user: data.created.user === true },
  };
}
