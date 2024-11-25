import { Router } from "express";
import updateArticlePriceService from "./updatePrice.route";

const router = Router();

router.route("/v1/prices/update").post(updateArticlePriceService);

export default router;