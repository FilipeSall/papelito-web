import { parsePhoneValue, toE164 } from "@/utils/phone";

/**
 * Número pronto para `wa.me` a partir do telefone como está gravado — E.164, mascarado ou só
 * dígitos —, ou `null` quando não há telefone usável.
 *
 * Devolver `null` é deliberado: um `wa.me` sem número abre o WhatsApp em branco, e quem clicou
 * concluiria que a conversa foi iniciada. Quem chama tem que decidir não renderizar o link.
 *
 * A conversão passa pelo `libphonenumber-js` em vez de testar prefixo `55`: DDD 55 é Santa
 * Maria/RS, então `(55) 3221-1234` precisa virar `555532211234` e não `5532211234`.
 */
export function chamadoWhatsappNumber(phone: string): string | null {
  const { country, nationalNumber } = parsePhoneValue(phone ?? "");

  if (nationalNumber.length < 10) {
    return null;
  }

  const e164 = toE164(nationalNumber, country);

  return e164 === "" ? null : e164.replace(/^\+/, "");
}

/**
 * Link de conversa com o texto já preenchido, ou `null` quando o vendor não tem telefone.
 */
export function chamadoWhatsappHref(phone: string, message = ""): string | null {
  const number = chamadoWhatsappNumber(phone);

  if (number === null) {
    return null;
  }

  return message === ""
    ? `https://wa.me/${number}`
    : `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Texto de abertura da conversa: diz de qual pedido se trata sem obrigar quem recebe a adivinhar. */
export function chamadoWhatsappMessage(orderNumber: string): string {
  return orderNumber === ""
    ? "Olá! Falo sobre um chamado aberto na Papelito."
    : `Olá! Falo sobre o pedido #${orderNumber} na Papelito.`;
}
