import { redirect } from "next/navigation";

/** "Mensagens" virou "Chamados". Mantido por uma release: há links em notificações já enviadas. */
export default function VendorMessagesRedirect() {
  redirect("/vendor/chamados");
}
