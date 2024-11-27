import { Article, ArticleState } from "../models/models";
import { NotFound } from "../utils/exceptions";

export async function updateArticleState(articleId: string, state: string) {
  const article = await Article.findOne({ articleId }).populate("stateId");

  if (!article) {
    throw new NotFound(`Article not found`)
  }

  const articleState = await ArticleState.findOne({ name: state });

  if (!articleState) {
    throw new Error(`Article state ${state} not found`);
  }

  article.stateId = articleState._id;
  return await article.save();
}

export async function createArticleWithState(articleId: string, state: string) {
  const articleState = await ArticleState.findOne({ name: state });

  if (!articleState) {
    throw new Error(`Article state ${state} not found`);
  }

  const article = new Article({
    articleId,
    stateId: articleState._id,
  });

  return article.save();
}
