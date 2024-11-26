import { Router } from "express";
import createDiscount from "./createDiscount.route";
import { getPrice, updatePrice } from "../controllers/prices.controller";

export function initRouter() {
  const router = Router();
  
  router.route("/v1/prices").get(getPrice);
  
  router.route("/v1/prices/update").post(updatePrice);
  
  router.route("/v1/discounts/create").post(createDiscount);

  return router;
}

