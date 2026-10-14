/**
 * Estado efetivo dos Correios de uma loja, como o WordPress o decide.
 *
 * `locked` vale enquanto a Braspress não está configurada: os Correios ficam
 * ligados à força e o vendor não pode desligá-los. Desligados, eles ainda
 * servem de contingência quando a Braspress falha tecnicamente.
 */
export type VendorCorreiosPreference = {
  enabled: boolean;
  locked: boolean;
};
