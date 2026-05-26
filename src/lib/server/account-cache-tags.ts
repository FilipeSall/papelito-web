export function getAccountCoverageCepTag(accountId: string) {
  return `account:coverage-cep:${accountId}`;
}

export function getAccountActiveVendorTag(accountId: string) {
  return `account:active-vendor:${accountId}`;
}
