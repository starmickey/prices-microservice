import { Router } from "express";
import updateArticlePrice from "./updatePrice.route";
import getMostRecentPrice from "./getMostRecentPrice.route";

const router = Router();

router.route("/v1/prices").get(getMostRecentPrice);

router.route("/v1/prices/update").post(updateArticlePrice);

export default router;