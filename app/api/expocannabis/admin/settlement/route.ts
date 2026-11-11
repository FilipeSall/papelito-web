import { proxyEventDownload, proxyEventJson } from "@/features/expocannabis/server/proxy-event-json";

export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get("format");

  if (format === "csv") {
    return proxyEventDownload("/admin/settlement?format=csv");
  }

  return proxyEventJson({ path: "/admin/settlement", method: "GET" });
}
