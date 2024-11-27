import { Request, Response } from "express";
import { updateArticlePriceService } from "../services/updateArticlePriceService";
import getErrorResponse from "../utils/getErrorResponse";
import { getMostRecentArticlePrice } from "../services/getMostRecentArticlePrice";
import { GetArticlePriceSchema, UpdateArticlePriceSchema } from "../dtos/schemas/pricesSchemas";

export async function getPrice(req: Request, res: Response) {
  try {
    const { articleId } = GetArticlePriceSchema.parse(req.query);

    const price = await getMostRecentArticlePrice(articleId);

    res.status(200).send({ articleId, price });
  } catch (error) {
    getErrorResponse(error, res);
    return;
  }
}

export async function updatePrice(req: Request, res: Response) {
  try {
    const { articleId, price, startDate } = UpdateArticlePriceSchema.parse(req.body);

    await updateArticlePriceService({ articleId, price, startDate });

    res.status(201).json({ articleId, price, startDate });
  } catch (error) {
    getErrorResponse(error, res);
    return;
  }
}

