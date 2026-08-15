import type { Db, ObjectId } from "mongodb";
import { ensureCollection, type MongoCollectionDefinition } from "../database/ensure-collection.js";
import { AuthIdentityStatus } from "../enums/auth-identity-status.enum.js";
import { AuthProvider } from "../enums/auth-provider.enum.js";

export interface AuthIdentityDocument {
  _id?: ObjectId;
  publicId: string;
  userId: ObjectId;
  provider: AuthProvider;
  providerTenant: string;
  providerSubject: string;
  providerUsername: string | null;
  signInIdentifier: string;
  signInIdentifierNormalized: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: AuthIdentityStatus;
  lastAuthenticationAttemptAt: Date | null;
  lastLoginAt: Date | null;
  lastLogoutAt: Date | null;
  lastFailedLoginAt: Date | null;
  failedLoginCount: number;
  createdAt: Date;
  updatedAt: Date;
  disabledAt: Date | null;
  deletedAt: Date | null;
}

export const AUTH_IDENTITY_COLLECTION: MongoCollectionDefinition = {
  name: "auth_identities",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: ["_id", "publicId", "userId", "provider", "providerTenant", "providerSubject", "providerUsername", "signInIdentifier", "signInIdentifierNormalized", "emailVerified", "phoneVerified", "status", "lastAuthenticationAttemptAt", "lastLoginAt", "lastLogoutAt", "lastFailedLoginAt", "failedLoginCount", "createdAt", "updatedAt", "disabledAt", "deletedAt"],
      properties: {
        _id: { bsonType: "objectId" },
        publicId: { bsonType: "string", minLength: 5, maxLength: 64 },
        userId: { bsonType: "objectId" },
        provider: { enum: Object.values(AuthProvider) },
        providerTenant: { bsonType: "string", maxLength: 200 },
        providerSubject: { bsonType: "string", maxLength: 200 },
        providerUsername: { bsonType: ["string", "null"], maxLength: 200 },
        signInIdentifier: { bsonType: "string", maxLength: 320 },
        signInIdentifierNormalized: { bsonType: "string", maxLength: 320 },
        emailVerified: { bsonType: "bool" },
        phoneVerified: { bsonType: "bool" },
        status: { enum: Object.values(AuthIdentityStatus) },
        lastAuthenticationAttemptAt: { bsonType: ["date", "null"] },
        lastLoginAt: { bsonType: ["date", "null"] },
        lastLogoutAt: { bsonType: ["date", "null"] },
        lastFailedLoginAt: { bsonType: ["date", "null"] },
        failedLoginCount: { bsonType: "int", minimum: 0 },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        disabledAt: { bsonType: ["date", "null"] },
        deletedAt: { bsonType: ["date", "null"] },
      },
    },
  },
  indexes: [
    { key: { publicId: 1 }, name: "auth_identities_public_id_unique", unique: true },
    { key: { provider: 1, providerTenant: 1, providerSubject: 1 }, name: "auth_identities_provider_subject_unique", unique: true },
    { key: { userId: 1, status: 1 }, name: "auth_identities_user_status" },
  ],
};

export function ensureAuthIdentityCollection(db: Db): Promise<void> {
  return ensureCollection(db, AUTH_IDENTITY_COLLECTION);
}

