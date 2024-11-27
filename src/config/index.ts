"use strict";

import * as dotenv from "dotenv";

let config: Config;


/*
Todas las configuraciones del servidor se encuentran en este modulo, si se quien
acceder desde cualquier parte del sistema, se deben acceder llamando a este método.
*/
export function getConfig(): Config {
  if (!config) {
    // El archivo .env es un archivo que si esta presente se leen las propiedades
    // desde ese archivo, sino se toman estas de aca para entorno dev.
    // .env es un archivo que no se debería subir al repo y cada server debería tener el suyo
    dotenv.config({ path: ".env" });

    config = {
      port: process.env.SERVER_PORT || "3001",
      mongoPath: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/test",
      rabbitUrl: process.env.RABBIT_URL || "amqp://@localhost:5672",
      notificationsQueue: process.env.NOTIFICATIONS_QUEUE || "",
      catalogUrl: process.env.CATALOG_SERVICE_BASE_URL || "",
      authUrl: process.env.AUTH_SERVICE_BASE_URL || ""
    }
  }
  return config;
}

export interface Config {
  port: string;
  mongoPath: string;
  rabbitUrl: string;
  notificationsQueue: string;
  catalogUrl: string;
  authUrl: string;
}