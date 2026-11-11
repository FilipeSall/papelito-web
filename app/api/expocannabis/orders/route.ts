import { proxyEventJson, readEventJson } from "@/features/expocannabis/server/proxy-event-json";

export async function POST(request: Request) {
  return proxyEventJson({
    path: "/orders",
    method: "POST",
    json: await readEventJson(request),
    idempotencyKey: request.headers.get("Idempotency-Key"),
  });
}
