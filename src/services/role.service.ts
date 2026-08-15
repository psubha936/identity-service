import { randomUUID } from "node:crypto";
import { MongoServerError, type Db } from "mongodb";
import { ErrorCode } from "../enums/error-code.enum.js";
import { HttpStatus } from "../enums/http-status.enum.js";
import { PermissionCode } from "../enums/permission-code.enum.js";
import { RoleStatus } from "../enums/role-status.enum.js";
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

function validationError(message: string, details?: unknown): AppError {
  return new AppError({
    status: HttpStatus.BAD_REQUEST,
    code: ErrorCode.VALIDATION_ERROR,
    message,
    ...(details === undefined ? {} : { details }),
  });
}

function requiredString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw validationError(`${field} must be a non-empty string`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw validationError(`${field} must not exceed ${maxLength} characters`);
  }
  return normalized;
}

export function parseCreateRoleInput(value: unknown): CreateRoleInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validationError("Request body must be a JSON object");
  }

  const body = value as Record<string, unknown>;
  const allowedFields = new Set([
    "code",
    "name",
    "description",
    "permissions",
    "status",
  ]);
  const unknownFields = Object.keys(body).filter((key) => !allowedFields.has(key));
  if (unknownFields.length > 0) {
    throw validationError("Request body contains unsupported fields", {
      fields: unknownFields,
    });
  }

  const code = requiredString(body.code, "code", 64);
  if (!/^[a-z][a-z0-9._-]{1,63}$/.test(code)) {
    throw validationError(
      "code must start with a lowercase letter and contain only lowercase letters, numbers, dots, underscores, or hyphens",
    );
  }

  const name = requiredString(body.name, "name", 120);
  let description = "";
  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      throw validationError("description must be a string");
    }
    description = body.description.trim();
  }
  if (description.length > 500) {
    throw validationError("description must not exceed 500 characters");
  }

  if (!Array.isArray(body.permissions)) {
    throw validationError("permissions must be an array");
  }
  const allowedPermissions = new Set<string>(Object.values(PermissionCode));
  const invalidPermissions = body.permissions.filter(
    (permission) => typeof permission !== "string" || !allowedPermissions.has(permission),
  );
  if (invalidPermissions.length > 0) {
    throw validationError("permissions contains unsupported values", {
      allowedValues: [...allowedPermissions],
    });
  }
  const permissions = body.permissions as PermissionCode[];
  if (new Set(permissions).size !== permissions.length) {
    throw validationError("permissions must not contain duplicates");
  }

  const status = body.status === undefined ? RoleStatus.Active : body.status;
  if (!Object.values(RoleStatus).includes(status as RoleStatus)) {
    throw validationError("status must be active or inactive");
  }

  return {
    code,
    name,
    description,
    permissions: [...permissions],
    status: status as RoleStatus,
  };
}

function toRoleResponse(role: RoleDocument): RoleResponse {
  return {
    publicId: role.publicId,
    code: role.code,
    name: role.name,
    description: role.description,
    permissions: [...role.permissions],
    builtIn: role.builtIn,
    status: role.status,
    version: role.version,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
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

      return toRoleResponse(role);
    },
  };
}
