import { Router } from "express";
import { getPriceHandler, updatePriceHandler } from "../controllers/prices.controller";
import { createDiscountHandler, updateDiscountHandler } from "../controllers/discounts.controller";
import { validateUserSignIn } from "../middlewares/auth.middleware";

export function initRouter() {
  const router = Router();
  
  router.route("/v1/prices").get(validateUserSignIn, getPriceHandler);
  
  router.route("/v1/prices/update").post(validateUserSignIn, updatePriceHandler);
  
  router.route("/v1/discounts/create").post(validateUserSignIn, createDiscountHandler);

  router.route("/v1/discounts/update").post(validateUserSignIn, updateDiscountHandler);

  return router;
}

