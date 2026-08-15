import assert from "node:assert/strict";
import test from "node:test";
import { BuiltInRoleCode } from "../src/enums/built-in-role-code.enum.js";
import { PublicAccountType } from "../src/enums/public-account-type.enum.js";
import { AUTH_IDENTITY_COLLECTION } from "../src/models/auth-identity.model.js";
import { ROLE_COLLECTION } from "../src/models/role.model.js";
import { USER_COLLECTION } from "../src/models/user.model.js";
import { USER_ROLE_ASSIGNMENT_COLLECTION } from "../src/models/user-role-assignment.model.js";
import { getPublicRegistrationRoleDecision } from "../src/services/registration-role.service.js";

test("identity model definitions include the core user and role collections", () => {
  assert.deepEqual(
    [
      USER_COLLECTION.name,
      AUTH_IDENTITY_COLLECTION.name,
      ROLE_COLLECTION.name,
      USER_ROLE_ASSIGNMENT_COLLECTION.name,
    ],
    ["users", "auth_identities", "roles", "user_role_assignments"],
  );

  assert.ok(
    USER_ROLE_ASSIGNMENT_COLLECTION.indexes.some(
      ({ name }) => name === "user_role_assignments_active_unique",
    ),
  );
});

test("public restaurant-owner registration cannot self-assign an elevated role", () => {
  assert.deepEqual(getPublicRegistrationRoleDecision(PublicAccountType.RestaurantOwner), {
    initialRoleCodes: [BuiltInRoleCode.Customer],
    requiresRestaurantOnboarding: true,
  });
});
