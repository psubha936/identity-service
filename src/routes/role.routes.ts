import { Router } from "express";
import { HttpStatus } from "../enums/http-status.enum.js";
import type { RoleService } from "../services/role.service.js";
import type { ApiSuccess } from "../types/api-response.js";
import { parseCreateRoleInput } from "../utils/role-validation.util.js";
import { logger } from "../utils/logger.util.js";

export function createRoleRouter(roleService: RoleService): Router {
  const router = Router();

  router.post("/roles", async (request, response) => {
    const input = parseCreateRoleInput(request.body);
    const role = await roleService.createRole(input);
    logger.info("Role created", {
      requestId: String(response.locals.requestId),
      roleId: role.publicId,
      roleCode: role.code,
    });
    const payload: ApiSuccess<typeof role> = {
      success: true,
      data: role,
      meta: {
        requestId: String(response.locals.requestId),
        timestamp: new Date().toISOString(),
      },
    };

    response.status(HttpStatus.CREATED).json(payload);
  });

  return router;
}
