"use strict";

import express, { Express, NextFunction, Request, Response } from "express";
import { Config } from "./environment";
import routes from "./routes/index";
import bodyParser from "body-parser";

export function init(appConfig: Config): Express {
  const app = express();
  app.set("port", appConfig.port);

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Middleware to log method and route
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  app.use("/", routes);

  return app;
}