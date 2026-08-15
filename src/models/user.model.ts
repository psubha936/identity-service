import type { Db, ObjectId } from "mongodb";
import { ensureCollection, type MongoCollectionDefinition } from "../database/ensure-collection.js";
import { UserStatus } from "../enums/user-status.enum.js";

export interface UserDocument {
  _id?: ObjectId;
  publicId: string;
  email: string;
  emailNormalized: string;
  phone: string | null;
  displayName: string;
  avatarKey: string | null;
  preferredLocale: string;
  timezone: string;
  status: UserStatus;
  statusReason: string | null;
  authorizationVersion: number;
  termsAcceptedAt: Date | null;
  privacyAcceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  disabledAt: Date | null;
  deletedAt: Date | null;
}

export const USER_COLLECTION: MongoCollectionDefinition = {
  name: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: ["_id", "publicId", "email", "emailNormalized", "phone", "displayName", "avatarKey", "preferredLocale", "timezone", "status", "statusReason", "authorizationVersion", "termsAcceptedAt", "privacyAcceptedAt", "createdAt", "updatedAt", "disabledAt", "deletedAt"],
      properties: {
        _id: { bsonType: "objectId" },
        publicId: { bsonType: "string", minLength: 5, maxLength: 64 },
        email: { bsonType: "string", maxLength: 320 },
        emailNormalized: { bsonType: "string", maxLength: 320 },
        phone: { bsonType: ["string", "null"], maxLength: 16 },
        displayName: { bsonType: "string", minLength: 1, maxLength: 120 },
        avatarKey: { bsonType: ["string", "null"], maxLength: 1024 },
        preferredLocale: { bsonType: "string", maxLength: 35 },
        timezone: { bsonType: "string", maxLength: 100 },
        status: { enum: Object.values(UserStatus) },
        statusReason: { bsonType: ["string", "null"], maxLength: 200 },
        authorizationVersion: { bsonType: "int", minimum: 1 },
        termsAcceptedAt: { bsonType: ["date", "null"] },
        privacyAcceptedAt: { bsonType: ["date", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        disabledAt: { bsonType: ["date", "null"] },
        deletedAt: { bsonType: ["date", "null"] },
      },
    },
  },
  indexes: [
    { key: { publicId: 1 }, name: "users_public_id_unique", unique: true },
    { key: { emailNormalized: 1 }, name: "users_email_unique", unique: true },
    { key: { status: 1, createdAt: -1 }, name: "users_status_created" },
  ],
};

export function ensureUserCollection(db: Db): Promise<void> {
  return ensureCollection(db, USER_COLLECTION);
}

