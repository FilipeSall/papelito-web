/**
 * Requisito avaliado pelo WordPress para liberar a venda da loja.
 */
export type VendorRequirementId = "account" | "boxes" | "pagarme";

/**
 * Um requisito como o WordPress o devolve.
 *
 * `satisfied` é o mínimo atendido; `blocking` é o que de fato tira a loja da vitrine agora; e
 * `advisory` marca a observação que não impede a venda — a recomendação de caixas e a falha de
 * sincronização sobre um recebedor que continua ativo.
 */
export type VendorEligibilityRequirement = {
  activeCount?: number;
  advisory: boolean;
  blocking: boolean;
  id: VendorRequirementId;
  reason: string;
  satisfied: boolean;
};

/**
 * Veredito completo de elegibilidade, já com a configuração vigente de caixas.
 *
 * `loadFailed` existe para o painel calar em vez de inventar: sem leitura, nenhum indicador é
 * exibido, porque quem decide de verdade é o WordPress em toda compra.
 */
export type VendorEligibility = {
  canSell: boolean;
  loadFailed: boolean;
  minimumBoxes: number;
  recommendedBoxes: number;
  requirements: VendorEligibilityRequirement[];
};
