import { redirect } from "next/navigation";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Cadastro de revendedor");

export default function RevendedorEtapa1Page() {
  redirect("/revendedor");
}
