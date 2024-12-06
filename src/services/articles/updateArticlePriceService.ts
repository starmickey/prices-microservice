import { PriceDTO } from "../../dtos/api-entities/prices.dto";
import { createArticleWithState, getArticleByArticleId, updateArticleState } from "../../repositories/articles.repository";
import { createArticlePrice } from "../../repositories/prices.repository";

interface UpdatePriceDTO {
  articleId: string;
  price: number;
  startDate?: Date;
}

export default async function updateArticlePrice({ articleId, price, startDate = new Date() }: UpdatePriceDTO): Promise<PriceDTO> {
  let article = await getArticleByArticleId(articleId);

  if (!article) {
    // Article doesn't exist, create a new one
    article = await createArticleWithState(articleId, 'TAXED');
  } else {
    article = await updateArticleState(articleId, 'TAXED');
  }

  await createArticlePrice(article._id, price, startDate);

  return { articleId, price, startDate };
}
