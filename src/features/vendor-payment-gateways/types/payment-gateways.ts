/** Gateways que a Papelito integra. Espelha `papelito_payment_providers()` no WordPress. */
export type PaymentProvider = "pagarme" | "mercadopago";

/**
 * Estado de apresentação de um gateway do vendor. Só `ready` e `degraded` recebem;
 * qualquer valor desconhecido vindo do backend é tratado como `unavailable`.
 */
export type GatewayState =
  | "unconfigured"
  | "connection_pending"
  | "verification_pending"
  | "kyc_pending"
  | "ready"
  | "degraded"
  | "unavailable"
  | "blocked_cnae";

/** Código CNAE que bloqueou a Pagar.me, com a posição em que apareceu no cadastro. */
export type CnaeRestriction = {
  code: string;
  position: "primary" | "secondary";
  label: string;
};

/** Saúde de um gateway do vendor (`GatewayStatus`), sem token nem dado de KYC. */
export type GatewayStatus = {
  provider: PaymentProvider;
  state: GatewayState;
  connectionStatus: string;
  kycStatus: string;
  restrictionCode: string;
  healthStatus: string;
  /** Decisão do backend; a tela nunca promove um gateway a apto por conta própria. */
  canReceive: boolean;
  reasonCodes: string[];
  pendingFields: string[];
  cnaeCodes: CnaeRestriction[];
  lastCheckedAt: string;
  lastSuccessAt: string;
  configurationVersion: string;
};

/** Gateway escolhido pelo vendor (exclusivo; `explicit: false` é o padrão da coorte); `version` é exigida para salvar (conflito vira 409). */
export type PaymentPreference = {
  preferredProvider: PaymentProvider;
  version: number;
  /** Falso enquanto vale o default da coorte (Mercado Pago). */
  explicit: boolean;
};

/** Resumo público da conta Mercado Pago vinculada por OAuth. */
export type MercadoPagoAccountSummary = {
  accountId: number;
  collectorId: string;
  identityStatus: string;
  status: string;
  tokenExpiresAt: string;
  connectedAt: string;
};

/** Modo financeiro do vendor: legado (Pagar.me de sempre), fluxo novo ou suspenso. */
export type VendorPaymentMode = "legacy" | "gateways" | "suspended";

/** Resposta de `GET /vendor/payment-gateways` (e do espelho administrativo). */
export type VendorPaymentSummary = {
  mode: VendorPaymentMode;
  gateways: GatewayStatus[];
  preference: PaymentPreference;
  mercadopagoAccount: MercadoPagoAccountSummary | null;
};

/** Fluxo de pagamento de uma compra: cobrança direta, redirect ao Checkout Pro ou coleta pendente. */
export type PaymentFlow = "direct" | "redirect" | "requires_payment_input";

/** Gateway e fluxo resolvidos pelo backend para o carrinho, sem cobrar nada. */
export type PaymentContext = {
  provider: PaymentProvider;
  flow: "direct" | "redirect";
  configurationVersion: string;
  fallbackReason: string;
};

/** Sócio do perfil financeiro: CPF e nascimento só como indicadores. */
export type FinancialProfilePartner = {
  name: string;
  email: string;
  motherName: string;
  monthlyIncome: string;
  professionalOccupation: string;
  hasDocument: boolean;
  documentLast4: string;
  hasBirthdate: boolean;
  selfDeclaredLegalRepresentative: boolean;
  address: Record<string, string>;
};

/** Pendências de cadastro de um gateway. */
export type GatewayPending = {
  policy?: string;
  pendingFields: string[];
};

/** Resposta de `GET/PATCH /vendor/financial-profile`. */
export type FinancialProfile = {
  version: number;
  /** CNPJ do cadastro autoritativo da loja (não editável no perfil); a conta PJ precisa ser dele. */
  cnpj: string;
  cnpjChanged: boolean;
  profile: {
    companyName: string;
    tradingName: string;
    corporationType: string;
    foundingDate: string;
    annualRevenue: string;
    managingPartners: FinancialProfilePartner[];
    bankAccount: Record<string, string>;
  };
  pending: {
    pagarme: GatewayPending;
    mercadopago: GatewayPending;
  };
};
