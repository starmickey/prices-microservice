"use strict";

import express, { Express, NextFunction, Request, Response } from "express";
import { Config } from "./config";
import { initRouter } from "./routes";
import bodyParser from "body-parser";
import { User } from "./dtos/api-entities/user.dto";

declare global {
  namespace Express {
    interface Request {
      user: User
    }
  }
}

export function initExpress(appConfig: Config): Express {
  const app = express();
  app.set("port", appConfig.port);

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Middleware to log method and route
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  app.use("/", initRouter());

  return app;
}