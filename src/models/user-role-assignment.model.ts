import type { Db, ObjectId } from "mongodb";
import { ensureCollection, type MongoCollectionDefinition } from "../database/ensure-collection.js";
import { RoleAssignmentStatus } from "../enums/role-assignment-status.enum.js";

export interface UserRoleAssignmentDocument {
  _id?: ObjectId;
  publicId: string;
  userId: ObjectId;
  roleId: ObjectId;
  status: RoleAssignmentStatus;
  assignmentReason: string;
  assignedBy: ObjectId | null;
  assignedAt: Date;
  revokedBy: ObjectId | null;
  revokedAt: Date | null;
  revocationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const USER_ROLE_ASSIGNMENT_COLLECTION: MongoCollectionDefinition = {
  name: "user_role_assignments",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: ["_id", "publicId", "userId", "roleId", "status", "assignmentReason", "assignedBy", "assignedAt", "revokedBy", "revokedAt", "revocationReason", "createdAt", "updatedAt"],
      properties: {
        _id: { bsonType: "objectId" },
        publicId: { bsonType: "string", minLength: 5, maxLength: 64 },
        userId: { bsonType: "objectId" },
        roleId: { bsonType: "objectId" },
        status: { enum: Object.values(RoleAssignmentStatus) },
        assignmentReason: { bsonType: "string", minLength: 1, maxLength: 500 },
        assignedBy: { bsonType: ["objectId", "null"] },
        assignedAt: { bsonType: "date" },
        revokedBy: { bsonType: ["objectId", "null"] },
        revokedAt: { bsonType: ["date", "null"] },
        revocationReason: { bsonType: ["string", "null"], maxLength: 500 },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  indexes: [
    { key: { publicId: 1 }, name: "user_role_assignments_public_id_unique", unique: true },
    { key: { userId: 1, roleId: 1 }, name: "user_role_assignments_active_unique", unique: true, partialFilterExpression: { status: RoleAssignmentStatus.Active } },
    { key: { userId: 1, status: 1 }, name: "user_role_assignments_user_status" },
  ],
};

export function ensureUserRoleAssignmentCollection(db: Db): Promise<void> {
  return ensureCollection(db, USER_ROLE_ASSIGNMENT_COLLECTION);
}

