import type {
  CnaeRestriction,
  FinancialProfile,
  FinancialProfilePartner,
  GatewayPending,
  GatewayState,
  GatewayStatus,
  MercadoPagoAccountSummary,
  PaymentContext,
  PaymentPreference,
  PaymentProvider,
  VendorPaymentMode,
  VendorPaymentSummary,
} from "../types/payment-gateways";

const PROVIDERS: readonly PaymentProvider[] = ["pagarme", "mercadopago"];
const STATES: readonly GatewayState[] = [
  "unconfigured",
  "connection_pending",
  "verification_pending",
  "kyc_pending",
  "ready",
  "degraded",
  "unavailable",
  "blocked_cnae",
];
const MODES: readonly VendorPaymentMode[] = ["legacy", "gateways", "suspended"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function texts(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isProvider(value: unknown): value is PaymentProvider {
  return typeof value === "string" && (PROVIDERS as readonly string[]).includes(value);
}

function parseCnaeCodes(value: unknown): CnaeRestriction[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((item) => ({
    code: text(item.code),
    position: item.position === "secondary" ? "secondary" : "primary",
    label: text(item.label),
  }));
}

/**
 * Lê um `GatewayStatus` do backend. Estado desconhecido vira `unavailable` e `canReceive` só é
 * verdadeiro com o booleano `true` — a tela nunca infere aptidão. Provider desconhecido é `null`.
 */
export function parseGatewayStatus(value: unknown): GatewayStatus | null {
  if (!isRecord(value) || !isProvider(value.provider)) return null;

  const known = (STATES as readonly string[]).includes(text(value.state));

  return {
    provider: value.provider,
    state: known ? (value.state as GatewayState) : "unavailable",
    connectionStatus: text(value.connectionStatus),
    kycStatus: text(value.kycStatus),
    restrictionCode: text(value.restrictionCode),
    healthStatus: text(value.healthStatus),
    canReceive: known && value.canReceive === true,
    reasonCodes: texts(value.reasonCodes),
    pendingFields: texts(value.pendingFields),
    cnaeCodes: parseCnaeCodes(value.cnaeCodes),
    lastCheckedAt: text(value.lastCheckedAt),
    lastSuccessAt: text(value.lastSuccessAt),
    configurationVersion: text(value.configurationVersion),
  };
}

/** Lê a preferência de gateway (`{ preferredProvider, version, explicit }`); malformada vira `null`. */
export function parsePaymentPreference(value: unknown): PaymentPreference | null {
  if (!isRecord(value) || !isProvider(value.preferredProvider) || typeof value.version !== "number") return null;

  return { preferredProvider: value.preferredProvider, version: value.version, explicit: value.explicit === true };
}

function parseAccount(value: unknown): MercadoPagoAccountSummary | null {
  if (!isRecord(value)) return null;

  return {
    accountId: typeof value.accountId === "number" ? value.accountId : 0,
    collectorId: text(value.collectorId),
    identityStatus: text(value.identityStatus),
    status: text(value.status),
    tokenExpiresAt: text(value.tokenExpiresAt),
    connectedAt: text(value.connectedAt),
  };
}

/** Lê o resumo financeiro do vendor; qualquer parte obrigatória malformada devolve `null`. */
export function parseVendorPaymentSummary(value: unknown): VendorPaymentSummary | null {
  if (!isRecord(value) || !Array.isArray(value.gateways)) return null;

  const preference = parsePaymentPreference(value.preference);
  if (!preference) return null;

  const mode = (MODES as readonly string[]).includes(text(value.mode)) ? (value.mode as VendorPaymentMode) : "legacy";

  return {
    mode,
    gateways: value.gateways.map(parseGatewayStatus).filter((item): item is GatewayStatus => item !== null),
    preference,
    mercadopagoAccount: parseAccount(value.mercadopagoAccount),
  };
}

/** Lê o `PaymentContext`; provider e fluxo precisam ser coerentes (MP só redirect, Pagar.me só direto). */
export function parsePaymentContext(value: unknown): PaymentContext | null {
  if (!isRecord(value) || !isProvider(value.provider)) return null;

  const expectedFlow = value.provider === "mercadopago" ? "redirect" : "direct";
  if (value.flow !== expectedFlow) return null;

  return {
    provider: value.provider,
    flow: expectedFlow,
    configurationVersion: text(value.configurationVersion),
    fallbackReason: text(value.fallbackReason),
  };
}

function parsePartner(value: unknown): FinancialProfilePartner {
  const record = isRecord(value) ? value : {};
  const address = isRecord(record.address) ? record.address : {};

  return {
    name: text(record.name),
    email: text(record.email),
    motherName: text(record.motherName),
    monthlyIncome: text(record.monthlyIncome),
    professionalOccupation: text(record.professionalOccupation),
    hasDocument: record.hasDocument === true,
    documentLast4: text(record.documentLast4),
    hasBirthdate: record.hasBirthdate === true,
    selfDeclaredLegalRepresentative: record.selfDeclaredLegalRepresentative === true,
    address: Object.fromEntries(Object.entries(address).map(([key, item]) => [key, text(item)])),
  };
}

function parsePending(value: unknown): GatewayPending {
  const record = isRecord(value) ? value : {};

  return { policy: text(record.policy) || undefined, pendingFields: texts(record.pendingFields) };
}

/** Lê o perfil financeiro público. CPF e nascimento só existem como indicadores; nada em claro é copiado. */
export function parseFinancialProfile(value: unknown): FinancialProfile | null {
  if (!isRecord(value) || typeof value.version !== "number" || !isRecord(value.profile)) return null;

  const profile = value.profile;
  const bank = isRecord(profile.bankAccount) ? profile.bankAccount : {};
  const partners = Array.isArray(profile.managingPartners) ? profile.managingPartners : [];
  const pending = isRecord(value.pending) ? value.pending : {};

  return {
    version: value.version,
    cnpj: text(value.cnpj),
    cnpjChanged: value.cnpjChanged === true,
    profile: {
      companyName: text(profile.companyName),
      tradingName: text(profile.tradingName),
      corporationType: text(profile.corporationType),
      foundingDate: text(profile.foundingDate),
      annualRevenue: text(profile.annualRevenue),
      managingPartners: (partners.length > 0 ? partners : [{}]).map(parsePartner),
      bankAccount: Object.fromEntries(Object.entries(bank).map(([key, item]) => [key, text(item)])),
    },
    pending: { pagarme: parsePending(pending.pagarme), mercadopago: parsePending(pending.mercadopago) },
  };
}
