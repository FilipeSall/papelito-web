export type VendorBraspressConfig = {
  senderCnpj: string;
  originCep: string;
  modal: string;
  freightType: string;
  consigneeCnpj: string;
  weightUnit: string;
  quoteTimezone: string;
  trackingTomadorCnpj: string;
};

export type VendorBraspressIntegration = {
  provider: "braspress";
  enabled: boolean;
  status: "unconfigured" | "ready" | "active" | "invalid_credentials";
  configurationVersion: number;
  configured: boolean;
  credentialsConfigured: boolean;
  config: VendorBraspressConfig;
  loadFailed: boolean;
};
