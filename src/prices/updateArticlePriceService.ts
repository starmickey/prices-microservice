import { Article, ArticlePrice, ArticleState } from './schema';

interface UpdateArticlePriceServiceParams {
  articleId: string;
  price: number;
  startDate: Date;
}

export async function updateArticlePriceService({ articleId, price, startDate }: UpdateArticlePriceServiceParams) {
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
  } else {
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
}
