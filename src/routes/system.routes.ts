import { Router } from "express";
import type { ServiceConfig } from "../config/service-config.js";
import type { IdentityInfrastructure } from "../infrastructure/identity-infrastructure.js";
import { HttpStatus } from "../enums/http-status.enum.js";
import { ErrorCode } from "../enums/error-code.enum.js";
import { AppError } from "../errors/app-error.js";
import type { ApiSuccess } from "../types/api-response.js";

interface HealthData {
  service: string;
  status: "ok";
  uptimeSeconds: number;
}

export function createSystemRouter(
  config: ServiceConfig,
  infrastructure?: IdentityInfrastructure,
): Router {
  const router = Router();

  const healthHandler = (
    _request: Parameters<Parameters<typeof router.get>[1]>[0],
    response: Parameters<Parameters<typeof router.get>[1]>[1],
  ): void => {
    const payload: ApiSuccess<HealthData> = {
      success: true,
      data: {
        service: config.serviceName,
        status: "ok",
        uptimeSeconds: Math.floor(process.uptime()),
      },
      meta: {
        requestId: String(response.locals.requestId),
        timestamp: new Date().toISOString(),
      },
    };

    response.status(HttpStatus.OK).json(payload);
  };

  router.get("/health", healthHandler);
  router.get("/ready", async (_request, response) => {
    try {
      await infrastructure?.checkReadiness();
    } catch (error) {
      throw new AppError({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: "Identity service dependencies are unavailable",
        cause: error,
      });
    }
    healthHandler(_request, response);
  });

  return router;
}
