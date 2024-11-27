import { Request, Response } from "express";
import { CreateDiscountSchema, UpdateDiscountSchema } from "../dtos/schemas/discountsSchemas";
import getErrorResponse from "../utils/getErrorResponse";
import { getArticleExists } from "../api/catalogApi";
import { Unauthorized } from "../utils/exceptions";
import { createDiscount, updateDiscount } from "../repositories/discounts.repository";

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

    await updateDiscount(params);

    res.status(201).send({ message: "discount updated", discount: params });

  } catch (error) {
    getErrorResponse(error, res);
  }
}