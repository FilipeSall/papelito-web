import {
  eventOrderNotFound,
  parseEventOrderId,
  proxyEventJson,
} from "@/features/expocannabis/server/proxy-event-json";

type Ctx = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const orderId = parseEventOrderId((await params).orderId);

  if (!orderId) {
    return eventOrderNotFound();
  }

  return proxyEventJson({ path: `/orders/${orderId}/status`, method: "GET" });
}
