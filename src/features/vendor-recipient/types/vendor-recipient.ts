export type VendorRecipient = {
  recipientId: string;
  status: string;
  kycStatus: string;
  kycStatusReason: string;
  lastSyncAt: string;
  lastError: string;
  lastErrorCode: string;
  loadFailed: boolean;
};
