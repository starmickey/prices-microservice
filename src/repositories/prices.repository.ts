import { NotFound } from "../utils/exceptions";
import { UpdatePriceDTO } from '../dtos/api-entities/prices.dto';
import { Article, ArticlePrice, ArticleState } from "../models/models";

export async function getMostRecentArticlePrice(articleId: string): Promise<number> {
  if (!articleId.trim()) {
    throw TypeError("Missing articleId parameter");
  }

  const article = await Article.findOne({ articleId }).populate("stateId");

  if (!article) {
    throw new NotFound("Article not found");
  }

  const articleState = await ArticleState.findById(article.stateId);
  if (!articleState || articleState.name !== "TAXED") {
    throw new Error("Article state is not 'TAXED'");
  }

  const today = new Date();
  const recentPrice = await ArticlePrice.findOne({ 
    articleId: article._id, 
    startDate: { $lte: today } // Filter for startDate <= today
  })
  .sort({ startDate: -1 }) // Sort by startDate descending to get the most recent price
  .limit(1); // Ensure only one price is returned

  if (!recentPrice) {
    throw new Error("No price information available for the article");
  }

  return recentPrice.price;
}

export async function updateArticlePrice({ articleId, price, startDate }: UpdatePriceDTO): Promise<UpdatePriceDTO> {
  // Validate existence of states
  const articleState = await ArticleState.findOne({ name: 'TAXED' });

  if (!articleState) {
    throw new Error("Article state 'TAXED' not found");
  }

  let article = await Article.findOne({ articleId });

  if (!article) {
    // Article doesn't exist, create a new one
    article = new Article({
      articleId,
      stateId: articleState._id,
    });
    await article.save();
  } else if (article.stateId !== articleState._id) {
    // Article exists, update its state
    article.stateId = articleState._id;
    await article.save();
  }

  const articlePrice = new ArticlePrice({
    price,
    articleId: article._id,
    startDate,
  });

  await articlePrice.save();

  return { articleId, price, startDate };
}
