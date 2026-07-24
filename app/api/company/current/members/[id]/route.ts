import { proxyCompanyRequest } from "@/lib/server/company-proxy";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  return proxyCompanyRequest(request, `/papelito/v1/companies/current/members/${encodeURIComponent(id)}`);
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { id } = await params;
  return proxyCompanyRequest(request, `/papelito/v1/companies/current/members/${encodeURIComponent(id)}`);
}
