import { proxyCompanyRequest } from "@/lib/server/company-proxy";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyCompanyRequest(
    request,
    `/papelito/v1/companies/current/invitations/eligibility${search}`,
  );
}
