import { CheckoutCustomSelect } from "./checkout-custom-select";
import { CheckoutField } from "./checkout-field";
import { INSTALLMENT_OPTIONS } from "./checkout-constants";

interface CreditCardFormFieldsProps {
  holderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  installments: string;
  onHolderNameChange: (value: string) => void;
  onCardNumberChange: (value: string) => void;
  onExpiryDateChange: (value: string) => void;
  onCvvChange: (value: string) => void;
  onInstallmentsChange: (value: string) => void;
}

export function CreditCardFormFields({
  holderName,
  cardNumber,
  expiryDate,
  cvv,
  installments,
  onHolderNameChange,
  onCardNumberChange,
  onExpiryDateChange,
  onCvvChange,
  onInstallmentsChange,
}: CreditCardFormFieldsProps) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <CheckoutField
          label="Nome no cartao"
          placeholder="Nome como impresso no cartao"
          value={holderName}
          onChange={onHolderNameChange}
        />
      </div>

      <div className="md:col-span-2">
        <CheckoutField
          label="Numero do cartao"
          placeholder="0000 0000 0000 0000"
          inputMode="numeric"
          maxLength={19}
          value={cardNumber}
          onChange={onCardNumberChange}
        />
      </div>

      <CheckoutField
        label="Validade"
        placeholder="MM/AA"
        inputMode="numeric"
        maxLength={5}
        value={expiryDate}
        onChange={onExpiryDateChange}
      />

      <CheckoutField
        label="CVV"
        placeholder="000"
        inputMode="numeric"
        maxLength={4}
        value={cvv}
        onChange={onCvvChange}
      />

      <div className="md:col-span-2">
        <CheckoutCustomSelect
          label="Parcelamento"
          options={INSTALLMENT_OPTIONS}
          placeholder="Selecione as parcelas"
          value={installments}
          onChange={onInstallmentsChange}
        />
      </div>
    </div>
  );
}
