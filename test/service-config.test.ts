import assert from "node:assert/strict";
import test from "node:test";
import { loadServiceConfig } from "../src/config/service-config.js";

const validEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  MONGODB_URI: "mongodb://localhost:27017",
  MONGODB_DATABASE: "foodpulse_identity_test",
  REDIS_URL: "redis://localhost:6379",
  AWS_REGION: "ap-south-1",
  COGNITO_USER_POOL_ID: "ap-south-1_test",
  COGNITO_APP_CLIENT_ID: "test-client-id",
  AWS_S3_DEFAULT_BUCKET: "foodpulse-identity-test",
};

test("loads required identity integrations without explicit AWS credentials", () => {
  const config = loadServiceConfig(validEnvironment);

  assert.equal(config.port, 8081);
  assert.equal(config.mongodb.databaseName, "foodpulse_identity_test");
  assert.equal(config.redis.url, "redis://localhost:6379");
  assert.equal(config.aws.region, "ap-south-1");
  assert.equal(config.aws.cognitoAppClientSecret, undefined);
});

test("rejects a missing required integration variable", () => {
  assert.throws(
    () => loadServiceConfig({ ...validEnvironment, MONGODB_URI: "" }),
    /MONGODB_URI is required/,
  );
});

test("rejects incomplete explicit AWS credentials", () => {
  assert.throws(
    () =>
      loadServiceConfig({
        ...validEnvironment,
        AWS_ACCESS_KEY_ID: "local-access-key",
      }),
    /AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be provided together/,
  );
});
