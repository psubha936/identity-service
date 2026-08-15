import { Router } from "express";
import { HttpStatus } from "../enums/http-status.enum.js";
import type { RoleService } from "../services/role.service.js";
import { parseCreateRoleInput } from "../services/role.service.js";
import type { ApiSuccess } from "../types/api-response.js";

export function createRoleRouter(roleService: RoleService): Router {
  const router = Router();

  router.post("/roles", async (request, response) => {
    const role = await roleService.createRole(parseCreateRoleInput(request.body));
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
