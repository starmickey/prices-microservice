"use strict";

import express, { Express, Request, Response } from "express";
import { Config } from "./environment";

export function init(appConfig: Config): Express {
  const app = express();
  app.set("port", appConfig.port);

  app.get("/", (req: Request, res: Response) => {
    res.send("Hello from server");
  });
  
  return app;
}