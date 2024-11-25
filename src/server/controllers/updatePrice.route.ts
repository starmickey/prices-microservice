import { Request, Response } from "express";
import { updateArticlePriceService } from "../../prices/updateArticlePriceService";
import { UpdateArticlePriceSchema } from "../utils/apiSchemas";
import { ZodError } from "zod";

export default async function updateArticlePrice(req: Request, res: Response) {
  try {
    // Validate the request body using Zod
    const { articleId, price, startDate } = UpdateArticlePriceSchema.parse(req.body);

    // Call your service with validated data
    await updateArticlePriceService({ articleId, price, startDate });

    res.status(201).json({ articleId, price, startDate });
    return;

  } catch (error) {
    if (error instanceof ZodError) {
      // Handle Zod validation errors
      res.status(400).json({ error: "Bad Request: " + error.errors.map((err) => err.message) });
      return;
    }

    console.error(error);

    if (error instanceof Error) {
      res.status(500).send({ error: error.message });
      return;
    }

    res.status(500).send({ error: "Internal server error." });
    return;
  }
}
