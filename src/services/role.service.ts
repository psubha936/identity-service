import { randomUUID } from "node:crypto";
import { MongoServerError, type Db } from "mongodb";
import { PermissionCode } from "../enums/permission-code.enum.js";
import { RoleStatus } from "../enums/role-status.enum.js";
import { ErrorCode } from "../enums/error-code.enum.js";
import { HttpStatus } from "../enums/http-status.enum.js";
import { AppError } from "../errors/app-error.js";
import { ROLE_COLLECTION, type RoleDocument } from "../models/role.model.js";

export interface CreateRoleInput {
  code: string;
  name: string;
  description: string;
  permissions: PermissionCode[];
  status: RoleStatus;
}

export interface RoleResponse {
  publicId: string;
  code: string;
  name: string;
  description: string;
  permissions: PermissionCode[];
  builtIn: boolean;
  status: RoleStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoleService {
  createRole(input: CreateRoleInput): Promise<RoleResponse>;
}

export function createRoleService(db: Db): RoleService {
  const roles = db.collection<RoleDocument>(ROLE_COLLECTION.name);

  return {
    async createRole(input) {
      const now = new Date();
      const role: RoleDocument = {
        publicId: `role_${randomUUID()}`,
        code: input.code,
        name: input.name,
        description: input.description,
        permissions: [...input.permissions],
        builtIn: false,
        status: input.status,
        version: 1,
        createdBy: null,
        updatedBy: null,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await roles.insertOne(role);
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
          throw new AppError({
            status: HttpStatus.CONFLICT,
            code: ErrorCode.CONFLICT,
            message: `A role with code '${input.code}' already exists`,
            cause: error,
          });
        }
        throw error;
      }

      return {
        publicId: role.publicId,
        code: role.code,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        builtIn: role.builtIn,
        status: role.status,
        version: role.version,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
      };
    },
  };
}
