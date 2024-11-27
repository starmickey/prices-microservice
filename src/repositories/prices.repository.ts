import { NotFound } from "../utils/exceptions";
import { UpdatePriceDTO } from '../dtos/api-entities/prices.dto';
import { Article, ArticlePrice, ArticleState } from "../models/models";
import { createArticleWithState, updateArticleState } from "./articles.repository";

export async function getMostRecentArticlePrice(articleId: string): Promise<number> {
  if (!articleId.trim()) {
    throw TypeError("Missing articleId parameter");
  }

  let article;

  article = await Article.findOne({ articleId }).populate("stateId");

  if (!article) {
    article = await createArticleWithState(articleId, 'UNTAXED');
    throw new Error("Article price has not been set yet");
  }

  const articleState = await ArticleState.findById(article.stateId);
  if (!articleState || articleState.name !== "TAXED") {
    throw new Error("Article price has not been set yet");
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

  let article = await Article.findOne({ articleId });

  if (!article) {
    // Article doesn't exist, create a new one
    article = await createArticleWithState(articleId, 'TAXED');
  } else {
    article = await updateArticleState(articleId, 'TAXED');
  }

  const articlePrice = new ArticlePrice({
    price,
    articleId: article._id,
    startDate,
  });

  await articlePrice.save();

  return { articleId, price, startDate };
}
