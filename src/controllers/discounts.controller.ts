import { Request, Response } from "express";
import { CreateDiscountSchema, DeleteDiscountSchema, GetArticleDiscountSchema, UpdateDiscountSchema } from "../dtos/schemas/discountsSchemas";
import getErrorResponse from "../utils/getErrorResponse";
import { getArticleExists } from "../api/catalogApi";
import { Unauthorized } from "../utils/exceptions";
import { createDiscount, deleteDiscount, updateDiscount } from "../repositories/discounts.repository";
import { updateArticleState } from "../repositories/articles.repository";
import { getValidDiscountsService } from "../services/discounts/getValidDiscountsService";

/**
 * Handles the creation of a new discount.
 *
 * Validates user authentication, input parameters, and optional article existence in the catalog.
 * If the validation passes, it creates the discount and responds with the created discount details.
 *
 * @param {Request} req - The HTTP request object containing user authentication and discount details.
 * @param {Response} res - The HTTP response object to send the result or error messages.
 * @returns {Promise<void>} - Responds with the created discount or an error message.
 */
export async function createDiscountHandler(req: Request, res: Response): Promise<void> {
  try {
    // Validate that the user is authenticated
    const token = req.user.token;
    if (!token) throw new Unauthorized();

    // Validate params types
    const params = CreateDiscountSchema.parse(req.body);

    // If articles provided, validate they exist in the catalog
    if (params.articles) {
      for (const { id } of params.articles) {
        const exists = await getArticleExists(id, token);

        if (!exists) {
          res.status(404).send({ error: `Article with id ${id} does not exist.` });
          return;
        }
      }
    }

    const discount = await createDiscount(params);

    res.status(201).send({ message: "Discount created", discount });

  } catch (error) {
    getErrorResponse(error, res);
  }
}

/**
 * Handles the update of an existent discount. Updating a discount consist on disabling the original discount
 * and creating a new one with the provided parameters.
 *
 * Validates user authentication, input parameters, and optional article existence in the catalog.
 * If the validation passes, it disables the old discount, creates a new one and responds with the created discount details.
 *
 * @param {Request} req - The HTTP request object containing user authentication and discount details.
 * @param {Response} res - The HTTP response object to send the result or error messages.
 * @returns {Promise<void>} - Responds with the created discount or an error message.
 */
export async function updateDiscountHandler(req: Request, res: Response): Promise<void> {
  try {
    // Validate that the user is authenticated
    const token = req.user.token;
    if (!token) throw new Unauthorized();

    // Validate user input types
    const params = UpdateDiscountSchema.parse(req.body);

    // If articles provided, validate they exist in the catalog
    if (params.articles) {
      for (const { id } of params.articles) {
        const exists = await getArticleExists(id, token);

        if (!exists) {
          res.status(404).send({ message: `Article with id ${id} does not exist.` });
          return;
        }
      }
    }

    const discount = await updateDiscount(params);

    res.status(201).send({ message: "Discount updated", discount });

  } catch (error) {
    getErrorResponse(error, res);
  }
}

/**
 * Handles the removal of a discount.
 *
 * @param {Request} req - The HTTP request object containing user authentication and discount details.
 * @param {Response} res - The HTTP response object to send the result or error messages.
 * @returns {Promise<void>} - Responds with the created discount or an error message.
 */
export async function deleteDiscountHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = DeleteDiscountSchema.parse(req.body);

    await deleteDiscount(id);

    res.status(201).send({ message: "Discount removed" });

  } catch (error) {
    getErrorResponse(error, res);
  }
}

export async function getValidDiscountsHandler(req: Request, res: Response) {
  try {
    // Validate user authentication
    const token = req.user.token;
    if (!token) throw new Unauthorized();

    // Validate query structure and types 
    const criteria = GetArticleDiscountSchema.parse(req.query);

    // Validate the the requested article exists in the catalog
    if (criteria.articleId) {
      const articleExists = await getArticleExists(criteria.articleId, token);

      if (!articleExists) {
        await updateArticleState(criteria.articleId, 'DELETED');
        res.status(404).json({ error: "Article not found" });
        return;
      }
    }

    const discounts = await getValidDiscountsService(criteria);

    res.status(200).send({ discounts });
  } catch (error) {
    getErrorResponse(error, res);
  }
}
