import { Request, Response } from "express";
import { getMostRecentArticlePrice } from "../../prices/repository";
import { NotFound } from "../../prices/exceptions";
import { ArticleSchema } from "../utils/apiSchemas";
import { z, ZodError } from "zod";

const schema = z.object({
  articleId: ArticleSchema
});

export default async function getMostRecentPrice(req: Request, res: Response) {
  try {
    // Validate inputs
    // if (!("articleId" in req.query)) {
    //   res.status(400).json({ error: "Bad request: Missing article id." });
    //   return;
    // }

    // const { articleId } = req.query;

    // if (typeof articleId !== "string" || !articleId.trim()) {
    //   res.status(400).json({ error: "Invalid articleId. Must be an string." });
    //   return;
    // }
    const { articleId } = schema.parse(req.query);

    const price = await getMostRecentArticlePrice(articleId);

    res.status(200).send({ articleId, price });

  } catch (error) {
    if (error instanceof ZodError) {
      // Handle Zod validation errors
      res.status(400).json({ error: "Bad Request: " + error.errors.map((err) => err.message) });
      return;
    } 

    if (error instanceof NotFound) {
      res.status(404).send({ error: error.message });
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