import { Request, Response } from "express";
import { CreateDiscountSchema } from "../dtos/schemas/discountsSchemas";
import getErrorResponse from "../utils/getErrorResponse";
import { getArticleExists } from "../api/catalogApi";
import { Unauthorized } from "../utils/exceptions";
import { createDiscount as createDiscountService, validateDiscountParameters } from "../repositories/createDiscount.repository";
import { Rabbit } from "../rabbitmq/rabbitConfig";

export async function createDiscount(req: Request, res: Response) {
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

    await createDiscountService(params);

    res.status(201).send({ message: "success" });

  } catch (error) {
    getErrorResponse(error, res);
  }
}