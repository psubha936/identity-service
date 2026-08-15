import {
  connectKafkaProducer,
  connectMongo,
  connectRedis,
  createAwsCognitoClient,
  createAwsS3Client,
  createKafkaClient,
  type AwsCognitoClient,
  type AwsS3Client,
  type KafkaProducerConnection,
  type MongoConnection,
  type RedisConnection,
} from "@subhaprakash/foodpulse-clients";
import type { ServiceConfig } from "../config/service-config.js";
import { ensureAuthIdentityCollection } from "../models/auth-identity.model.js";
import { ensureRoleCollection } from "../models/role.model.js";
import { ensureUserRoleAssignmentCollection } from "../models/user-role-assignment.model.js";
import { ensureUserCollection } from "../models/user.model.js";

interface KafkaAdminConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchTopicMetadata(): Promise<unknown>;
}

export interface IdentityInfrastructure {
  mongo: MongoConnection;
  redis: RedisConnection;
  kafkaAdmin: KafkaAdminConnection;
  kafkaProducer: KafkaProducerConnection;
  cognito: AwsCognitoClient;
  s3: AwsS3Client;
  checkReadiness(): Promise<void>;
  close(): Promise<void>;
}

export async function connectIdentityInfrastructure(
  config: ServiceConfig,
): Promise<IdentityInfrastructure> {
  let mongo: MongoConnection | undefined;
  let redis: RedisConnection | undefined;
  let kafkaAdmin: KafkaAdminConnection | undefined;
  let kafkaProducer: KafkaProducerConnection | undefined;
  let cognito: AwsCognitoClient | undefined;
  let s3: AwsS3Client | undefined;

  try {
    mongo = await connectMongo({
      uri: config.mongodb.uri,
      databaseName: config.mongodb.databaseName,
      appName: config.serviceName,
    });

    await Promise.all([
      ensureUserCollection(mongo.db),
      ensureAuthIdentityCollection(mongo.db),
      ensureRoleCollection(mongo.db),
      ensureUserRoleAssignmentCollection(mongo.db),
    ]);

    redis = await connectRedis({
      url: config.redis.url,
      clientName: config.serviceName,
    });

    const kafka = createKafkaClient({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
    });
    kafkaAdmin = kafka.createAdmin();
    await kafkaAdmin.connect();
    await kafkaAdmin.fetchTopicMetadata();
    kafkaProducer = await connectKafkaProducer(kafka);

    cognito = createAwsCognitoClient({
      region: config.aws.region,
      userPoolId: config.aws.cognitoUserPoolId,
      appClientId: config.aws.cognitoAppClientId,
      ...(config.aws.cognitoAppClientSecret
        ? { appClientSecret: config.aws.cognitoAppClientSecret }
        : {}),
    });
    s3 = createAwsS3Client({
      region: config.aws.region,
      bucket: config.aws.s3DefaultBucket,
    });

    const connectedMongo = mongo;
    const connectedRedis = redis;
    const connectedKafkaAdmin = kafkaAdmin;
    const connectedKafkaProducer = kafkaProducer;
    const connectedCognito = cognito;
    const connectedS3 = s3;

    return {
      mongo: connectedMongo,
      redis: connectedRedis,
      kafkaAdmin: connectedKafkaAdmin,
      kafkaProducer: connectedKafkaProducer,
      cognito: connectedCognito,
      s3: connectedS3,
      async checkReadiness() {
        await Promise.all([
          connectedMongo.ping(),
          connectedRedis.ping(),
          connectedKafkaAdmin.fetchTopicMetadata(),
        ]);
      },
      async close() {
        connectedCognito.close();
        connectedS3.close();
        const results = await Promise.allSettled([
          connectedKafkaProducer.close(),
          connectedKafkaAdmin.disconnect(),
          connectedRedis.close(),
          connectedMongo.close(),
        ]);
        const failure = results.find(
          (result): result is PromiseRejectedResult => result.status === "rejected",
        );
        if (failure) throw failure.reason;
      },
    };
  } catch (error) {
    cognito?.close();
    s3?.close();
    await Promise.allSettled([
      kafkaProducer?.close(),
      kafkaAdmin?.disconnect(),
      redis?.close(),
      mongo?.close(),
    ]);
    throw error;
  }
}
