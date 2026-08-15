import type { Db, ObjectId } from "mongodb";
import { ensureCollection, type MongoCollectionDefinition } from "../database/ensure-collection.js";
import { PermissionCode } from "../enums/permission-code.enum.js";
import { RoleStatus } from "../enums/role-status.enum.js";

export interface RoleDocument {
  _id?: ObjectId;
  publicId: string;
  code: string;
  name: string;
  description: string;
  permissions: PermissionCode[];
  builtIn: boolean;
  status: RoleStatus;
  version: number;
  createdBy: ObjectId | null;
  updatedBy: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ROLE_COLLECTION: MongoCollectionDefinition = {
  name: "roles",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: ["_id", "publicId", "code", "name", "description", "permissions", "builtIn", "status", "version", "createdBy", "updatedBy", "createdAt", "updatedAt"],
      properties: {
        _id: { bsonType: "objectId" },
        publicId: { bsonType: "string", minLength: 5, maxLength: 64 },
        code: { bsonType: "string", pattern: "^[a-z][a-z0-9._-]{1,63}$" },
        name: { bsonType: "string", minLength: 1, maxLength: 120 },
        description: { bsonType: "string", maxLength: 500 },
        permissions: { bsonType: "array", uniqueItems: true, items: { enum: Object.values(PermissionCode) } },
        builtIn: { bsonType: "bool" },
        status: { enum: Object.values(RoleStatus) },
        version: { bsonType: "int", minimum: 1 },
        createdBy: { bsonType: ["objectId", "null"] },
        updatedBy: { bsonType: ["objectId", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  indexes: [
    { key: { code: 1 }, name: "roles_code_unique", unique: true },
    { key: { publicId: 1 }, name: "roles_public_id_unique", unique: true },
  ],
};

export function ensureRoleCollection(db: Db): Promise<void> {
  return ensureCollection(db, ROLE_COLLECTION);
}

