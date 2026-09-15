export type VendorBraspressConfig = {
  senderCnpj: string;
  originCep: string;
};

export type VendorBraspressIntegration = {
  provider: "braspress";
  enabled: boolean;
  status: "unconfigured" | "ready" | "active" | "invalid_credentials" | "provider_blocked";
  configurationVersion: number;
  configured: boolean;
  credentialsConfigured: boolean;
  config: VendorBraspressConfig;
  loadFailed: boolean;
};
