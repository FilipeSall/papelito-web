import { ASSIGNABLE_ROLES, type CompanyRole } from "@/features/company/types/company";
import { roleLabel } from "@/features/company/utils/labels";

import type { CompanySelectOption } from "./company-select";

export const ASSIGNABLE_ROLE_OPTIONS: readonly CompanySelectOption<CompanyRole>[] =
  ASSIGNABLE_ROLES.map((role) => ({ value: role, label: roleLabel(role) }));
