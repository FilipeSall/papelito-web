import { setupServer } from "msw/node";

import { authHandlers } from "./handlers/auth";
import { availabilityHandlers } from "./handlers/availability";
import { cartHandlers } from "./handlers/cart";
import { cepHandlers } from "./handlers/cep";
import { checkoutHandlers } from "./handlers/checkout";
import { companyHandlers } from "./handlers/company";
import { couponsHandlers } from "./handlers/coupons";
import { notificationsHandlers } from "./handlers/notifications";
import { profileOrdersHandlers } from "./handlers/profile-orders";

export const server = setupServer(
  ...authHandlers,
  ...availabilityHandlers,
  ...cartHandlers,
  ...cepHandlers,
  ...checkoutHandlers,
  ...companyHandlers,
  ...couponsHandlers,
  ...notificationsHandlers,
  ...profileOrdersHandlers,
);
