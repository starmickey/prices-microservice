import { Router } from "express";
import { getPrice, updatePrice } from "../controllers/prices.controller";
import { createDiscount, updateDiscount } from "../controllers/discounts.controller";
import { validateUserSignIn } from "../middlewares/auth.middleware";

export function initRouter() {
  const router = Router();
  
  router.route("/v1/prices").get(validateUserSignIn, getPrice);
  
  router.route("/v1/prices/update").post(validateUserSignIn, updatePrice);
  
  router.route("/v1/discounts/create").post(validateUserSignIn, createDiscount);

  router.route("/v1/discounts/update").post(validateUserSignIn, updateDiscount);

  return router;
}

