import { ErrorCode } from "../enums/error-code.enum.js";
import { HttpStatus } from "../enums/http-status.enum.js";
import { PermissionCode } from "../enums/permission-code.enum.js";
import { RoleStatus } from "../enums/role-status.enum.js";
import { AppError } from "../errors/app-error.js";
import type { CreateRoleInput } from "../services/role.service.js";

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
  const code = requiredString(body.code, "code", 64);
  const name = requiredString(body.name, "name", 120);
  const description = body.description === undefined
    ? ""
    : requiredString(body.description, "description", 500);

  if (!/^[a-z][a-z0-9._-]{1,63}$/.test(code)) {
    throw validationError("code has an invalid format");
  }

  if (!Array.isArray(body.permissions)) {
    throw validationError("permissions must be an array");
  }

  const allowedPermissions = Object.values(PermissionCode);
  if (!body.permissions.every(
    (permission): permission is PermissionCode =>
      typeof permission === "string" &&
      allowedPermissions.includes(permission as PermissionCode),
  )) {
    throw validationError("permissions contains unsupported values");
  }

  if (new Set(body.permissions).size !== body.permissions.length) {
    throw validationError("permissions must not contain duplicates");
  }

  const status = body.status ?? RoleStatus.Active;
  if (!Object.values(RoleStatus).includes(status as RoleStatus)) {
    throw validationError("status must be active or inactive");
  }

  return {
    code,
    name,
    description,
    permissions: body.permissions,
    status: status as RoleStatus,
  };
}

