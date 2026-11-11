import {
  eventOrderNotFound,
  parseEventOrderId,
  proxyEventJson,
  readEventJson,
} from "@/features/expocannabis/server/proxy-event-json";

type Ctx = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const orderId = parseEventOrderId((await params).orderId);

  if (!orderId) {
    return eventOrderNotFound();
  }

  return proxyEventJson({ path: `/orders/${orderId}/retry`, method: "POST", json: await readEventJson(request) });
}
