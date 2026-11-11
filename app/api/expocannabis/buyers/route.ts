import { proxyEventJson, readEventJson } from "@/features/expocannabis/server/proxy-event-json";

export async function POST(request: Request) {
  return proxyEventJson({ path: "/buyers", method: "POST", json: await readEventJson(request) });
}
