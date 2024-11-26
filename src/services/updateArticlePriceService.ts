import { UpdatePriceDTO } from '../dtos/api-entities/prices.dto';
import { Article, ArticlePrice, ArticleState } from '../models/models';

/**
 * Updates an article's price or creates a new article if it doesn't exist.
 * It ensures that the article is associated with the "TAXED" state before saving the price.
 * 
 * @param {Object} params - The parameters required to update the article price.
 * @param {string} params.articleId - The unique identifier of the article.
 * @param {number} params.price - The new price for the article.
 * @param {Date} params.startDate - The date when the price starts being effective.
 * 
 * @throws {Error} Throws an error if the "TAXED" state is not found.
 * 
 * @returns {Promise<void>} Resolves when the price update is completed or a new article is created.
 */
export async function updateArticlePriceService({ articleId, price, startDate }: UpdatePriceDTO): Promise<UpdatePriceDTO> {
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
