export const SERVICE_NAME = "identity-service" as const;
export const DEFAULT_PORT = 8081;

export type NodeEnvironment = "development" | "test" | "production";

export interface MongoConfig {
  uri: string;
  databaseName: string;
}

export interface RedisConfig {
  url: string;
}

export interface AwsConfig {
  region: string;
  cognitoUserPoolId: string;
  cognitoAppClientId: string;
  cognitoAppClientSecret?: string;
  s3DefaultBucket: string;
}

export interface ServiceConfig {
  serviceName: typeof SERVICE_NAME;
  nodeEnv: NodeEnvironment;
  host: string;
  port: number;
  mongodb: MongoConfig;
  redis: RedisConfig;
  aws: AwsConfig;
}

function optionalValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function requireValue(
  environment: NodeJS.ProcessEnv,
  key: string,
): string {
  const value = optionalValue(environment[key]);
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function validateAwsCredentialEnvironment(environment: NodeJS.ProcessEnv): void {
  const accessKeyId = optionalValue(environment.AWS_ACCESS_KEY_ID);
  const secretAccessKey = optionalValue(environment.AWS_SECRET_ACCESS_KEY);
  const sessionToken = optionalValue(environment.AWS_SESSION_TOKEN);

  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
    throw new Error(
      "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be provided together",
    );
  }

  if (sessionToken && (!accessKeyId || !secretAccessKey)) {
    throw new Error(
      "AWS_SESSION_TOKEN requires AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY",
    );
  }
}

function parseNodeEnvironment(value: string | undefined): NodeEnvironment {
  if (value === undefined || value === "") return "development";
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }
  throw new Error("NODE_ENV must be development, test, or production");
}

function parsePort(value: string | undefined): number {
  if (value === undefined || value === "") return DEFAULT_PORT;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
}

export function loadServiceConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ServiceConfig {
  validateAwsCredentialEnvironment(environment);
  const cognitoAppClientSecret = optionalValue(
    environment.COGNITO_APP_CLIENT_SECRET,
  );

  return {
    serviceName: SERVICE_NAME,
    nodeEnv: parseNodeEnvironment(environment.NODE_ENV),
    host: environment.HOST?.trim() || "0.0.0.0",
    port: parsePort(environment.PORT),
    mongodb: {
      uri: requireValue(environment, "MONGODB_URI"),
      databaseName: requireValue(environment, "MONGODB_DATABASE"),
    },
    redis: {
      url: requireValue(environment, "REDIS_URL"),
    },
    aws: {
      region: requireValue(environment, "AWS_REGION"),
      cognitoUserPoolId: requireValue(environment, "COGNITO_USER_POOL_ID"),
      cognitoAppClientId: requireValue(environment, "COGNITO_APP_CLIENT_ID"),
      ...(cognitoAppClientSecret
        ? { cognitoAppClientSecret }
        : {}),
      s3DefaultBucket: requireValue(environment, "AWS_S3_DEFAULT_BUCKET"),
    },
  };
}
