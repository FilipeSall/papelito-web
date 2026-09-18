import { setupServer } from "msw/node";

import { authHandlers } from "./handlers/auth";
import { availabilityHandlers } from "./handlers/availability";
import { cartHandlers } from "./handlers/cart";
import { cepHandlers } from "./handlers/cep";
import { chamadosHandlers } from "./handlers/chamados";
import { checkoutHandlers } from "./handlers/checkout";
import { companyHandlers } from "./handlers/company";
import { contactConfigHandlers } from "./handlers/contact-config";
import { integrationSecretsHandlers } from "./handlers/integration-secrets";
import { couponsHandlers } from "./handlers/coupons";
import { notificationsHandlers } from "./handlers/notifications";
import { packagingProfilesHandlers } from "./handlers/packaging-profiles";
import { profileOrdersHandlers } from "./handlers/profile-orders";

export const server = setupServer(
  ...authHandlers,
  ...availabilityHandlers,
  ...cartHandlers,
  ...cepHandlers,
  ...chamadosHandlers,
  ...checkoutHandlers,
  ...companyHandlers,
  ...contactConfigHandlers,
  ...integrationSecretsHandlers,
  ...couponsHandlers,
  ...notificationsHandlers,
  ...packagingProfilesHandlers,
  ...profileOrdersHandlers,
);
