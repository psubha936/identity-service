import { BuiltInRoleCode } from "../enums/built-in-role-code.enum.js";
import { PublicAccountType } from "../enums/public-account-type.enum.js";

export interface PublicRegistrationRoleDecision {
  initialRoleCodes: readonly [BuiltInRoleCode.Customer];
  requiresRestaurantOnboarding: boolean;
}

export function getPublicRegistrationRoleDecision(
  accountType: PublicAccountType,
): PublicRegistrationRoleDecision {
  return {
    initialRoleCodes: [BuiltInRoleCode.Customer],
    requiresRestaurantOnboarding:
      accountType === PublicAccountType.RestaurantOwner,
  };
}

