import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createApp } from "../src/app.js";
import { loadServiceConfig } from "../src/config/service-config.js";
import { PermissionCode } from "../src/enums/permission-code.enum.js";
import { RoleStatus } from "../src/enums/role-status.enum.js";
import {
  parseCreateRoleInput,
  type RoleService,
} from "../src/services/role.service.js";

const config = loadServiceConfig({
  NODE_ENV: "test",
  MONGODB_URI: "mongodb://localhost:27017",
  MONGODB_DATABASE: "foodpulse_identity_test",
  REDIS_URL: "redis://localhost:6379",
  KAFKA_BROKERS: "localhost:9092",
  AWS_REGION: "ap-south-1",
  COGNITO_USER_POOL_ID: "ap-south-1_test",
  COGNITO_APP_CLIENT_ID: "test-client-id",
  AWS_S3_DEFAULT_BUCKET: "foodpulse-identity-test",
});

test("validates and normalizes role creation input", () => {
  assert.deepEqual(
    parseCreateRoleInput({
      code: "restaurant_support",
      name: " Restaurant support ",
      permissions: [PermissionCode.RestaurantRead],
    }),
    {
      code: "restaurant_support",
      name: "Restaurant support",
      description: "",
      permissions: [PermissionCode.RestaurantRead],
      status: RoleStatus.Active,
    },
  );

  assert.throws(
    () => parseCreateRoleInput({
      code: "restaurant_support",
      name: "Restaurant support",
      permissions: ["not.a.permission"],
    }),
    /unsupported values/,
  );
});

test("POST /roles delegates validated data and returns the common API shape", async (context) => {
  let capturedCode: string | undefined;
  const roleService: RoleService = {
    async createRole(input) {
      capturedCode = input.code;
      return {
        publicId: "role_test-id",
        ...input,
        builtIn: false,
        version: 1,
        createdAt: "2026-08-15T00:00:00.000Z",
        updatedAt: "2026-08-15T00:00:00.000Z",
      };
    },
  };
  const server = createApp(config, { roleService }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  context.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  const { port } = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${port}/roles`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      code: "restaurant_support",
      name: "Restaurant support",
      permissions: [PermissionCode.RestaurantRead],
    }),
  });
  const payload = await response.json() as {
    success: boolean;
    data: { publicId: string };
    meta: { requestId: string };
  };

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.publicId, "role_test-id");
  assert.ok(payload.meta.requestId);
  assert.equal(capturedCode, "restaurant_support");
});
