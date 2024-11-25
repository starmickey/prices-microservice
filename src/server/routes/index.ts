import { Router } from "express";
import updateArticlePrice from "../controllers/updatePrice.route";
import getMostRecentPrice from "../controllers/getMostRecentPrice.route";
import createDiscount from "../controllers/createDiscount.route";

const router = Router();

router.route("/v1/prices").get(getMostRecentPrice);

router.route("/v1/prices/update").post(updateArticlePrice);

router.route("/v1/discounts/create").post(createDiscount);

export default router;