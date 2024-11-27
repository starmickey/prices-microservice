import { Request, Response } from "express";
import getErrorResponse from "../utils/getErrorResponse";
import { GetArticlePriceSchema, UpdateArticlePriceSchema } from "../dtos/schemas/pricesSchemas";
import { Unauthorized } from "../utils/exceptions";
import { getArticleExists } from "../api/catalogApi";
import { emitPriceUpdatedEvent } from "../rabbitmq/notificationsApi";
import { markArticleAsRemoved } from "../repositories/articles.repository";
import { getMostRecentArticlePrice, updateArticlePrice } from "../repositories/prices.repository";

export async function getPriceHandler(req: Request, res: Response) {
  try {
    const token = req.user.token;

    if (!token) {
      throw new Unauthorized();
    }

    const { articleId } = GetArticlePriceSchema.parse(req.query);

    const articleExists = await getArticleExists(articleId, token);

    if (!articleExists) {
      markArticleAsRemoved(articleId);
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const price = await getMostRecentArticlePrice(articleId);

    res.status(200).send({ articleId, price });
  } catch (error) {
    getErrorResponse(error, res);
  }
}

export async function updatePriceHandler(req: Request, res: Response) {
  try {
    const token = req.user.token;

    if (!token) {
      throw new Unauthorized();
    }

    const { articleId, price, startDate } = UpdateArticlePriceSchema.parse(req.body);

    const articleExists = await getArticleExists(articleId, token);

    if (!articleExists) {
      markArticleAsRemoved(articleId);
      res.status(404).json({ error: "Article not found" });
      return;
    }

    await updateArticlePrice({ articleId, price, startDate });

    emitPriceUpdatedEvent({ articleId, price, startDate });

    res.status(201).json({ articleId, price, startDate });

  } catch (error) {
    getErrorResponse(error, res);
    return;
  }
}

