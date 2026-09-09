export type VendorReturnStatus =
  | "requested"
  | "rejected"
  | "awaiting_reverse_authorization"
  | "awaiting_posting"
  | "posting_expired"
  | "in_transit"
  | "awaiting_vendor_receipt"
  | "under_inspection"
  | "refund_pending"
  | "refunded"
  | "cancelled";

export type VendorReturnItem = {
  id: number;
  orderItemId: number;
  productId: number;
  productName: string;
  requestedQty: number;
  receivedQty: number | null;
  eligibleAmountCents: number;
  condition: string | null;
  stockDisposition: string | null;
};

export type VendorReturnRefund = {
  amountCents: number;
  refundedAt: string;
  method: string;
  proofId: number;
};

export type VendorReturn = {
  id: number;
  orderId: number;
  status: VendorReturnStatus;
  reason: string;
  reasonOther: string;
  authorizationCode: string;
  authorizationInstructions: string;
  authorizationExpiresAt: string;
  reverseShipmentId: number;
  requestedAt: string;
  receivedAt: string;
  refundDueAt: string;
  refundedAt: string;
  eligibleAmountCents: number;
  items: VendorReturnItem[];
  refund: VendorReturnRefund | null;
};

export type VendorReturnEvent = {
  event: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorUserId: number;
  createdAt: string;
};
