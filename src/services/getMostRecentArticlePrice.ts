import { NotFound } from "../utils/exceptions";
import { Article, ArticlePrice, ArticleState, Discount, DiscountType, DiscountTypeParameter } from "../models/models";

/**
 * Gets the price of the most recent ArticlePrice for a given article.
 * @param {string} articleId - The ID of the article.
 * @throws {NotFound | Error} If the article does not exist, its state is not 'TAXED', or no price is found.
 * @returns {Promise<number>} - The price of the most recent ArticlePrice.
 */
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

interface CreateDiscountProps {
  name: string;
  description: string;
  articles: {
    id: string;
    quantity: number;
  }[],
  discountTypeId: string;
  startDate: Date;
  endDate: Date | undefined;
  parameterValues: {
    id: string;
    value: string;
  }[]
}

export async function createDiscount() {
  
}

interface ValidateDiscountParametersProps {
  discountTypeId: string;
  parameterValues: {
    id: string;
    value: string;
  }[]
}

export function validateDiscountParameters({ discountTypeId, parameterValues}: CreateDiscountProps) {
  const discountType = DiscountType.findOne({ id: discountTypeId });

  if(!discountType) {
    throw new NotFound("DiscountType not found");
  }

  const discountTypeParameters = DiscountTypeParameter.find({ discountTypeId });

  


}