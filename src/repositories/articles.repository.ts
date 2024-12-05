import { Article, ArticleState } from "../models/models";
import { NotFound } from "../utils/exceptions";

export async function getArticleByArticleId(articleId: string) {
  const article = await Article.findOne({ articleId });

  if (!article) {
    throw new NotFound("Article was not found");
  }

  return article;
}

export async function getBulkOfArticlesByArticleId(articleIds: string[]) {
  const fetchedIds = await Article.find({ articleId: { $in: articleIds } });

  if (fetchedIds.length !== articleIds.length) {
    throw new NotFound("Couldn't find all of the articles. Ensure that they exist and have been taxed");
  }

  return fetchedIds;
}

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
