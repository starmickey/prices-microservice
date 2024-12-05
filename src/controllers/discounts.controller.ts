import { Request, Response } from "express";
import { CreateDiscountSchema, DeleteDiscountSchema, GetArticleDiscountSchema, UpdateDiscountSchema } from "../dtos/schemas/discountsSchemas";
import getErrorResponse from "../utils/getErrorResponse";
import { getArticleExists } from "../api/catalogApi";
import { Unauthorized } from "../utils/exceptions";
import { deleteDiscount, getValidDiscounts } from "../repositories/discounts.repository";
import { updateArticleState } from "../repositories/articles.repository";
import createDiscountService from "../services/discounts/createDiscountService";
import updateDiscountService from "../services/discounts/updateDiscountService";

export async function createDiscountHandler(req: Request, res: Response) {
  try {
    const params = CreateDiscountSchema.parse(req.body);

    const token = req.user.token;

    if (!token) {
      throw new Unauthorized()
    }

    if (params.articles) {
      for (const { id } of params.articles) {
        const exists = await getArticleExists(id, token);

        if (!exists) {
          res.status(404).send({
            message: `Article with id ${id} does not exist.`,
          });
          return;
        }
      }
    }

    const discount = await createDiscountService(params);

    res.status(201).send({ message: "discount created", discount });

  } catch (error) {
    getErrorResponse(error, res);
  }
}

export async function updateDiscountHandler(req: Request, res: Response) {
  try {
    const params = UpdateDiscountSchema.parse(req.body);

    const token = req.user.token;

    if (!token) {
      throw new Unauthorized()
    }

    if (params.articles) {
      for (const { id } of params.articles) {
        const exists = await getArticleExists(id, token);

        if (!exists) {
          res.status(404).send({
            message: `Article with id ${id} does not exist.`,
          });
          return;
        }
      }
    }

    const discount = await updateDiscountService(params);

    res.status(201).send({ message: "discount updated", discount });

  } catch (error) {
    getErrorResponse(error, res);
  }
}

export async function deleteDiscountHandler(req: Request, res: Response) {
  try {
    const { id } = DeleteDiscountSchema.parse(req.body);

    await deleteDiscount(id);

    res.status(201).send({ message: "discount removed" });

  } catch (error) {
    getErrorResponse(error, res);
  }
}

export async function getValidDiscountsHandler(req: Request, res: Response) {
  try {
    const token = req.user.token;

    const criteria = GetArticleDiscountSchema.parse(req.query);

    if (criteria.articleId) {
      const articleExists = await getArticleExists(criteria.articleId, token);

      if (!articleExists) {
        updateArticleState(criteria.articleId, 'DELETED');
        res.status(404).json({ error: "Article not found" });
        return;
      }
    }

    const discounts = await getValidDiscounts(criteria);

    res.status(200).send({ discounts });
  } catch (error) {
    getErrorResponse(error, res);
  }
}

// export async function getArticleValidDiscountsHandler(req: Request, res: Response) {
//   try {
//     const token = req.user.token;

//     if (!token) {
//       throw new Unauthorized();
//     }


//     const discounts = await getArticleValidDiscounts(articleId);

//     res.status(200).send({ discounts });

//   } catch (error) {
//     getErrorResponse(error, res);
//   }
// }