import { Request, Response } from "express";
import { CreateDiscountSchema, DeleteDiscountSchema, GetArticleDiscountSchema, UpdateDiscountSchema } from "../dtos/schemas/discountsSchemas";
import getErrorResponse from "../utils/getErrorResponse";
import { getArticleExists } from "../api/catalogApi";
import { Unauthorized } from "../utils/exceptions";
import { createDiscount, deleteDiscount, getValidDiscounts, updateDiscount } from "../repositories/discounts.repository";
import { updateArticleState } from "../repositories/articles.repository";

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

    const discountId = await createDiscount(params);

    res.status(201).send({ message: "discount created", discount: { discountId, ...params } });

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

    const newDiscountId = await updateDiscount(params);

    res.status(201).send({ message: "discount updated", discount: { ...params, discountId: newDiscountId } });

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