import { Request, Response } from "express";
import { updateArticlePriceService } from "../repositories/updateArticlePrice.repository";
import getErrorResponse from "../utils/getErrorResponse";
import { getMostRecentArticlePrice } from "../repositories/getMostRecentPrice.repository";
import { GetArticlePriceSchema, UpdateArticlePriceSchema } from "../dtos/schemas/pricesSchemas";
import { Unauthorized } from "../utils/exceptions";
import { getArticleExists } from "../api/catalogApi";
import markArticleAsRemoved from "../repositories/markArticleAsRemoved.repository";

export async function getPrice(req: Request, res: Response) {
  try {
    const { articleId } = GetArticlePriceSchema.parse(req.query);

    const price = await getMostRecentArticlePrice(articleId);

    res.status(200).send({ articleId, price });
  } catch (error) {
    getErrorResponse(error, res);
  }
}

export async function updatePrice(req: Request, res: Response) {
  try {
    const token = req.user.token;

    if(!token) {
      throw new Unauthorized();
    }

    const { articleId, price, startDate } = UpdateArticlePriceSchema.parse(req.body);

    const articleExists = await getArticleExists(articleId, token);

    if (!articleExists) {
      markArticleAsRemoved(articleId);
      res.status(404).json({ error: "Article not found" });
      return;
    }

    await updateArticlePriceService({ articleId, price, startDate });

    res.status(201).json({ articleId, price, startDate });

  } catch (error) {
    getErrorResponse(error, res);
    return;
  }
}

