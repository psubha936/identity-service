import express, { type Express } from "express";
import helmet from "helmet";
import type { ServiceConfig } from "./config/service-config.js";
import type { IdentityInfrastructure } from "./infrastructure/identity-infrastructure.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import { requestContext } from "./middleware/request-context.middleware.js";
import { createSystemRouter } from "./routes/system.routes.js";
import { createRoleRouter } from "./routes/role.routes.js";
import type { RoleService } from "./services/role.service.js";

export interface IdentityAppDependencies {
  infrastructure?: IdentityInfrastructure;
  roleService?: RoleService;
}

export function createApp(
  config: ServiceConfig,
  dependencies: IdentityAppDependencies = {},
): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(requestContext);
  app.use(createSystemRouter(config, dependencies.infrastructure));
  if (dependencies.roleService) app.use(createRoleRouter(dependencies.roleService));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
