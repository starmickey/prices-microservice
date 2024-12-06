import { Types } from 'mongoose';
import { PriceDTO } from '../dtos/api-entities/prices.dto';
import { Article, ArticlePrice, ArticleState } from "../models/models";
import { createArticleWithState } from "./articles.repository";

/**
 * Retrieves the most recent price for a given article.
 *
 * @param {string} articleId - The unique identifier of the article used by the catalog microservice.
 * @returns {Promise<number>} - The most recent price of the article.
 *
 * @throws {TypeError} If the `articleId` is empty or invalid.
 * @throws {Error} If the article or price information is missing or unavailable.
 */
export async function getMostRecentArticlePrice(articleId: string): Promise<number> {
  if (!articleId || !articleId.trim()) {
    throw new TypeError("Missing or invalid articleId parameter");
  }

  let article = await Article.findOne({ articleId }).populate("stateId");

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
    startDate: { $lte: today },
  })
    .sort({ startDate: -1 })
    .limit(1);

  if (!recentPrice) {
    throw new Error("No price information available for the article");
  }

  return recentPrice.price;
}


/**
 * Creates a new price entry for a given article.
 *
 * @param {Types.ObjectId} articleId - The unique MongoDB identifier of the article.
 * @param {number} price - The price to be set for the article.
 * @param {Date} [startDate] - The optional start date for the price; defaults to the current date.
 * @returns {Promise<PriceDTO>} - The created price object including the article ID, price, and start date.
 */
export async function createArticlePrice(
  articleId: Types.ObjectId,
  price: number,
  startDate?: Date
): Promise<PriceDTO> {
  const articlePrice = new ArticlePrice({
    price,
    articleId,
    startDate: startDate || new Date(),
  });

  const newArticlePrice = await articlePrice.save();

  return {
    articleId: newArticlePrice.articleId.toString(),
    price: newArticlePrice.price,
    startDate: newArticlePrice.startDate,
  };
}
