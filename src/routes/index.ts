import { Router } from "express";
import { getPriceHandler, updatePriceHandler } from "../controllers/prices.controller";
import { createDiscountHandler, deleteDiscountHandler, getValidDiscountsHandler, updateDiscountHandler } from "../controllers/discounts.controller";
import { validateUserSignIn } from "../middlewares/auth.middleware";
import { getCartCost } from "../controllers/calculator.controller";

export function initRouter() {
  const router = Router();
  
  router.route("/v1/prices").get(validateUserSignIn, getPriceHandler);
  
  router.route("/v1/prices/update").post(validateUserSignIn, updatePriceHandler);
  
  router.route("/v1/discounts/create").post(validateUserSignIn, createDiscountHandler);

  router.route("/v1/discounts/update").post(validateUserSignIn, updateDiscountHandler);

  router.route("/v1/discounts/delete").post(validateUserSignIn, deleteDiscountHandler);

  router.route("/v1/discounts").get(validateUserSignIn, getValidDiscountsHandler);
  
  router.route("/v1/calculate").post(validateUserSignIn, getCartCost);

  return router;
}

