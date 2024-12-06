import { Types } from "mongoose";
import { CalculateCartCostDTO } from "../dtos/api-entities/calculator.dto";
import { ArticleDiscount, ArticlePrice, Discount } from "../models/models";
import { BadRequest, NotFound } from "../utils/exceptions";
import { getBulkOfArticlesByArticleId } from "../repositories/articles.repository";
import { getDiscountsValues, getDiscountsWithoutArticles } from "../repositories/discounts.repository";

/**
 * Calculates the monetary value of a cart. 
 * Actually it can apply only one discount per cart.
 * 
 * @param cart 
 * @returns the value of the whole cart, an array its articles and its costs and the discount applied
 */
export default async function calculateCartCost(cart: CalculateCartCostDTO) {
  const articleCatalogIds = cart.articles.map(article => article.articleId);

  const [articles, discounts] = await Promise.all([
    getBulkOfArticlesByArticleId(articleCatalogIds),
    fetchValidDiscounts()
  ]);

  const articleDiscounts = await fetchArticleDiscounts(articles, discounts);

  // Determine which discounts can be applied
  const appliableDiscounts = await filterApplicableDiscounts(
    cart,
    articles,
    articleDiscounts,
    discounts
  );

  // If the discount contains values, ensure that they were provided
  const discountValues = await getDiscountsValues(appliableDiscounts);
  const validatedDiscounts = validateDiscountParameters(
    cart,
    appliableDiscounts,
    discountValues
  );

  // Get articles' prices without discounts
  const articlePrices = await calculateArticlePrices(articles);

  // Get the best discount
  const bestDiscount = calculateBestDiscount(
    cart,
    articles,
    articlePrices,
    articleDiscounts,
    validatedDiscounts
  );

  return {
    totalAmount: bestDiscount.totalAmount,
    articles: bestDiscount.articles,
    discount: {
      id: bestDiscount.discount._id,
      name: bestDiscount.discount.name,
      description: bestDiscount.discount.description || "",
    },
  };
}

// Fetch discounts valid for the current date
async function fetchValidDiscounts() {
  const currentDate = new Date();

  return Discount.find({
    startDate: { $lte: currentDate },
    $or: [
      { endDate: { $gte: currentDate } },
      { endDate: null }
    ]
  });
}

// Fetch ArticleDiscounts based on available articles and discounts
async function fetchArticleDiscounts(articles: any[], discounts: any[]) {
  const articleIds = articles.map(a => a._id);
  const discountIds = discounts.map(d => d._id);

  return ArticleDiscount.find({
    articleId: { $in: articleIds },
    discountId: { $in: discountIds }
  })
    .select("discountId articleId price quantity");
}

// Filter discounts applicable to the cart
async function filterApplicableDiscounts(cart: CalculateCartCostDTO, articles: any[], articleDiscounts: any[], discounts: any[]) {
  const possibleDiscountIds = discounts.map(d => d.id.toString());

  const filteredDiscounts = possibleDiscountIds.filter(discountId => {
    const relatedDiscounts = articleDiscounts.filter(ad => ad.discountId.toString() === discountId);

    if (!relatedDiscounts.length) return true;

    return relatedDiscounts.every(ad => {
      const article = articles.find(a => a._id.equals(ad.articleId));
      if (!article) {
        throw new Error("Article not found while filtering discounts.");
      }
      const cartArticle = cart.articles.find(ca => ca.articleId === article.articleId);
      return cartArticle && cartArticle.quantity >= ad.quantity;
    });
  });

  const discountsWithArticles = discounts.filter(d => filteredDiscounts.includes(d._id.toString()));
  return [...discountsWithArticles, ...(await getDiscountsWithoutArticles())];
}


// Validate the provided discount parameters against stored values
function validateDiscountParameters(cart: CalculateCartCostDTO, discounts: any[], discountValues: any[]) {
  return discounts.filter(discount => {
    const values = discountValues.filter(v => v.discountId.equals(discount._id));

    if (!values.length) return true;

    const providedDiscount = cart.discounts?.find(d => discount._id.equals(new Types.ObjectId(d.id)));
    if (!providedDiscount || !providedDiscount.parameters) return false;

    return values.every(v =>
      providedDiscount.parameters?.some(p =>
        v.discountTypeParameterId.equals(new Types.ObjectId(p.id)) && v.value === p.value
      )
    );
  });
}

// Calculate prices for all articles without discounts
async function calculateArticlePrices(articles: any[]) {

  const articleIds = articles.map(a => a._id);

  return ArticlePrice.find({
    articleId: { $in: articleIds },
    startDate: { $lte: new Date() } // Filter for startDate <= today
  })
    .sort({ startDate: -1 }) // Sort by startDate descending to get the most recent price
    .limit(1)
}

// Determine the best discount for the cart
function calculateBestDiscount(cart: CalculateCartCostDTO, articles: any[], articlePrices: any[], articleDiscounts: any[], discounts: any[]) {
  const calculateDiscountCost = (discount: any) => {
    const discountArticles = articleDiscounts.filter(ad => ad.discountId.equals(discount._id));

    const articlesTotals = cart.articles.map((cartArticle) => {
      const article = articles.find(a => a.articleId === cartArticle.articleId);
      if (!article) throw new NotFound(`Article of id ${cartArticle.articleId} was not found`);

      const priceEntry = articlePrices.find(ap => ap.articleId.equals(article._id));
      if (!priceEntry) throw new BadRequest(`Article of id ${cartArticle.articleId} has not been taxed.`);
      const price = priceEntry.price;

      const articleDiscount = discountArticles.find(ad => ad.articleId.equals(article._id));

      let amount = 0;

      if (articleDiscount) {
        const discountedQuantity = Math.floor(cartArticle.quantity / articleDiscount.quantity);
        const remainingQuantity = cartArticle.quantity % articleDiscount.quantity;
        amount = discountedQuantity * articleDiscount.price + remainingQuantity * price;
      } else {
        amount = cartArticle.quantity * price;
      }

      return {
        id: cartArticle.articleId,
        quantity: cartArticle.quantity,
        amount,
      }
    });

    const totalAmount = articlesTotals.reduce((total, articleTotal) => total + articleTotal.amount, 0);

    return { discount, totalAmount, articlesTotals };
  };

  const discountCosts = discounts.map(calculateDiscountCost);
  const bestDiscount = discountCosts.reduce((min, curr) => (curr.totalAmount < min.totalAmount ? curr : min));

  return {
    totalAmount: bestDiscount.totalAmount,
    discount: bestDiscount.discount,
    articles: bestDiscount.articlesTotals
  };
}