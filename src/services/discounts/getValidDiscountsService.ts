import { DiscountDTO } from "../../dtos/api-entities/discounts.dto";
import { findArticleDiscounts, findDiscountTypeParameters, findDiscountTypeParameterValues, findDiscountTypes, findFilteredArticleDiscounts, findValidDiscounts } from "../../repositories/discounts.repository";
import { getArticleByArticleId } from "../../repositories/articles.repository";
import { Article, DataType } from "../../models/models";

export interface GetValidDiscountsCriteriaCriteria {
  articleId?: string
}

export async function getValidDiscountsService(
  criteria: GetValidDiscountsCriteriaCriteria
): Promise<DiscountDTO[]> {
  const articleDiscountFilter: any = {};

  if (criteria.articleId) {
    const article = await getArticleByArticleId(criteria.articleId);
    articleDiscountFilter.articleId = article._id;
  }

  const articleDiscounts = await findArticleDiscounts(articleDiscountFilter);
  const validDiscountIds = articleDiscounts.map((ad) => ad.discountId);

  const discountFilter: any = {};

  if (criteria.articleId) {
    discountFilter._id = { $in: validDiscountIds };
  }

  const discounts = await findValidDiscounts(discountFilter);
  const discountIds = discounts.map((d) => d._id);
  const discountTypeIds = discounts.map((d) => d.discountTypeId);

  const [
    discountTypes,
    discountTypeParameters,
    discountTypeParameterValues,
  ] = await Promise.all([
    findDiscountTypes(discountTypeIds),
    findDiscountTypeParameters(discountTypeIds),
    findDiscountTypeParameterValues(discountIds),
  ]);

  const filteredArticleDiscounts = criteria.articleId
    ? articleDiscounts.filter((ad) => validDiscountIds.includes(ad.discountId))
    : await findFilteredArticleDiscounts(discountIds);

  const dtos: DiscountDTO[] = discounts.map((discount) => {
    const dType = discountTypes.find((type) =>
      type._id.equals(discount.discountTypeId)
    );

    if (!dType) {
      throw new Error(`Discount Type invalid: ${discount.discountTypeId} or not found`);
    }

    const dParams = discountTypeParameters.filter((param) =>
      param.discountTypeId.equals(dType._id)
    );
    const dValues = discountTypeParameterValues.filter((value) =>
      value.discountId.equals(discount._id)
    );
    const articles = filteredArticleDiscounts.filter((art) =>
      art.discountId.equals(discount._id)
    );

    return {
      id: String(discount.id),
      name: discount.name,
      description: discount.description || "",
      articles: articles.map((a) => ({
        id: String(a.articleId instanceof Article ? a.articleId.articleId : ""),
        price: a.price,
        quantity: a.quantity,
      })),
      discountType: {
        id: String(dType.id),
        name: dType.name,
        description: dType.description || "",
        parameters: dParams.map((param) => ({
          id: String(param.id),
          name: param.name,
          dataTypeName: param.type instanceof DataType ? param.type.name : "",
          value: dValues.find((value) =>
            value.discountTypeParameterId.equals(param._id)
          )?.value || "",
        })),
      },
      startDate: discount.startDate,
      endDate: discount.endDate,
    };
  });

  return dtos;
}
