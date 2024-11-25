import { Request, Response } from "express";
import { getMostRecentArticlePrice } from "../../prices/repository";
import { NotFound } from "../../prices/exceptions";

export default async function getMostRecentPrice(req: Request, res: Response) {
  try {
    // Validate inputs
    if (!("articleId" in req.query)) {
      console.warn("Bad request: Missing article id.")
      res.status(400).json({ error: "Bad request: Missing article id." });
      return;
    }

    const { articleId } = req.query;

    if (typeof articleId !== "string" || !articleId.trim()) {
      console.warn("Invalid articleId: ", articleId);
      res.status(400).json({ error: "Invalid articleId. Must be an string." });
      return;
    }

    const price = await getMostRecentArticlePrice(articleId);

    res.status(200).send({ articleId, price });

  } catch (error) {
    if (error instanceof NotFound) {
      res.status(404).send({ error: error.message });
      return;
    }

    if (error instanceof Error) {
      res.status(500).send({ error: error.message });
    }

    res.status(500).send({ error: "Internal server error." });
  }
}