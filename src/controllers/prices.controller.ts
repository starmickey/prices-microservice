import { Request, Response } from "express";
import getErrorResponse from "../utils/getErrorResponse";
import { parseGetArticlePriceSchema, parseUpdateArticlePriceSchema } from "../dtos/schemas/pricesSchemas";
import { NotFound, Unauthorized } from "../utils/exceptions";
import { getArticleExists } from "../api/catalogApi";
import { emitPriceUpdatedEvent } from "../rabbitmq/notificationsApi";
import { getMostRecentArticlePrice } from "../repositories/prices.repository";
import { updateArticleState } from "../repositories/articles.repository";
import updateArticlePrice from "../services/articles/updateArticlePriceService";

/**
 * Handles the retrieval of the most recent price for a given article.
 *
 * Validates user authentication, input structure and article existence. 
 * Returns the most recent price if available or an error message if not.
 *
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @returns {Promise<void>} - Responds with the article price or an error message.
 */
export async function getPriceHandler(req: Request, res: Response): Promise<void> {
  try {
    // Validate user authentication
    const token = req.user.token;
    if (!token) throw new Unauthorized();

    // Validate input structure using zod
    const { articleId } = parseGetArticlePriceSchema(req.query);

    // Validate article exists in catalog microservice
    const articleExists = await getArticleExists(articleId, token);

    if (!articleExists) {
      await updateArticleState(articleId, 'DELETED');
      throw new NotFound("Article not found");
    }

    const price = await getMostRecentArticlePrice(articleId);

    res.status(200).send({ articleId, price });
  } catch (error) {
    getErrorResponse(error, res);
  }
}


/**
 * Handles the update of an article's price.
 *
 * Validates user authentication, input structure and article existence before updating the price.
 * Emits a Rabbit event upon successful price update and returns the updated price details.
 *
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @returns {Promise<void>} - Responds with the updated price details or an error message.
 */
export async function updatePriceHandler(req: Request, res: Response): Promise<void> {
  try {
    // Validate user authentication
    const token = req.user.token;
    if (!token) throw new Unauthorized();

    // Validate input structure using zod
    const { articleId, price, startDate } = parseUpdateArticlePriceSchema(req.body);

    // Validate article exists in catalog microservice
    const articleExists = await getArticleExists(articleId, token);

    if (!articleExists) {
      updateArticleState(articleId, 'DELETED');
      res.status(404).json({ error: "Article not found" });
      return;
    }

    await updateArticlePrice({ articleId, price, startDate });
    emitPriceUpdatedEvent({ articleId, price, startDate });

    res.status(201).json({ articleId, price, startDate });

  } catch (error) {
    getErrorResponse(error, res);
  }
}

