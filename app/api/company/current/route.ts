import { proxyCompanyRequest } from "@/lib/server/company-proxy";

export async function GET(request: Request) {
  return proxyCompanyRequest(request, "/papelito/v1/companies/current");
}

export async function PATCH(request: Request) {
  return proxyCompanyRequest(request, "/papelito/v1/companies/current");
}
