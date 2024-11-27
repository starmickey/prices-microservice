import { Article, ArticleState } from "../models/models";

export async function markArticleAsRemoved(articleId: string) {
  const article = await Article.findOne({ articleId }).populate("stateId");

  if (!article) {
    // If article doesn't exist in the database, return
    return;
  }

  const articleState = await ArticleState.findOne({ name: 'DELETED' });

  if (!articleState) {
    throw new Error("Article state 'DELETED' not found");
  }

  article.stateId = articleState._id;
  await article.save();
}