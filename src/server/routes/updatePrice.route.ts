import { Request, Response } from "express";
import moment from "moment"; // For date handling
import { updateArticlePriceService } from "../../prices/updateArticlePriceService";

export default async function updateArticlePrice(req: Request, res: Response) {
  try {
    // Validate inputs
    if(!("articleId" in req.body) || !("price" in req.body)) {
      res.status(400).json({ error: "Bad request: Missing parameters." });
      return;
    }

    const { articleId, price } = req.body;

    if (typeof articleId !== "string" || !articleId.trim()) {
      res.status(400).json({ error: "Invalid articleId. Must be an string." });
      return;
    }

    if (typeof price !== "number" || price <= 0) {
      res.status(400).json({ error: "Invalid price. Must be a numeric value greater than zero." });
      return;
    }

    let startDate;

    if ("startDate" in req.body) {
      const providedDate = req.body.startDate;
      const currentDate = moment();
      const parsedStartDate = moment(providedDate);

      if (!parsedStartDate.isValid() || parsedStartDate.isBefore(currentDate)) {
        res.status(400).json({ error: "Invalid startDate. Must be a valid date after the current date." });
        return;
      }

      startDate = new Date(providedDate);
    } else {
      startDate = new Date();
    }

    await updateArticlePriceService({ articleId, price, startDate })

    res.status(201).json({ articleId, price, startDate });
    return;

  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error "})
    }
  }
}
