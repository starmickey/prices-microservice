import { CreateDiscountDTO, UpdateDiscountDTO, ParameterValueDTO, DiscountDTO } from "../dtos/api-entities/discounts.dto";
import { Article, ArticleDiscount, DataType, Discount, DiscountType, DiscountTypeParameter, DiscountTypeParameterValue } from "../models/models";
import { validateType } from "../utils/dataTypeValidator";
import { BadRequest, NotFound } from "../utils/exceptions";


export async function createDiscount(params: CreateDiscountDTO) {
  await validateDiscountParameters(params);

  // Validate that all of the articles exist in the database
  const articleIds = params.articles?.map(a => a.id) || [];
  const articles = await Article.find({ articleId: { $in: articleIds } });

  if (articleIds.length !== articles.length) {
    const foundArticleIds = articles.map((article) => article.articleId);
    const missingArticleIds = articleIds.filter((id) => !foundArticleIds.includes(id));

    throw new BadRequest(
      `The following articleIds do not exist: ${missingArticleIds.join(", ")}`
    )
  }

  // Create entities
  const discount = new Discount({
    name: params.name,
    description: params.description || "",
    startDate: params.startDate || new Date(),
    endDate: params.endDate || null,
    discountTypeId: params.discountTypeId,
  });

  await discount.save();

  // Create and execute ArticleDiscount entities concurrently
  const articleDiscountPromises = params.articles?.map((articleParam) => {
    const articleDiscount = new ArticleDiscount({
      price: articleParam.price,
      quantity: articleParam.quantity,
      articleId: articles.find(a => a.articleId === articleParam.id)?._id, // Map articleId to ObjectId
      discountId: discount._id,
    });
    return articleDiscount.save(); // Return the promise for each save
  }) || [];

  // Execute the savePromises for DiscountTypeParameterValue entities concurrently
  const paramValuesPromises = params.parameterValues?.map((paramValue) => {
    const discountValue = new DiscountTypeParameterValue({
      value: paramValue.value,
      deleteDate: null,
      discountTypeParameterId: paramValue.id,
      discountId: discount._id,
    });
    return discountValue.save(); // Return the promise for each save
  }) || [];

  // Run both sets of promises concurrently
  await Promise.all([
    ...articleDiscountPromises, // Wait for all ArticleDiscount saves
    ...paramValuesPromises // Wait for all DiscountTypeParameterValue saves
  ]);

  return discount._id;
}

export async function updateDiscount(params: UpdateDiscountDTO) {
  const discount = await Discount.findById(params.id);

  if (!discount) {
    throw new NotFound(`Discount not found`);
  }

  const currentDate = new Date();

  if (!discount.endDate || discount.endDate > currentDate) {
    discount.endDate = currentDate;
    await discount.save();
  }

  return await createDiscount(params);
}

export async function deleteDiscount(discountId: string) {
  const discount = await Discount.findById(discountId);

  if (!discount) {
    throw new NotFound(`Discount not found`);
  }

  const currentDate = new Date();

  if (!discount.endDate || discount.endDate > currentDate) {
    discount.endDate = currentDate;
    await discount.save();
    return;
  }

  throw new BadRequest(`Discount already disabled or expired`);
}

interface Criteria {
  articleId?: string;
}

export async function getValidDiscounts(criteria?: Criteria) {
  const currentDate = new Date();

  // Get valid discount ids when article is present
  const articleDiscountFilter: any = {};

  if (criteria?.articleId) {
    const article = await Article.findOne({ articleId: criteria.articleId });

    if(!article) {
      throw new NotFound("No discounts were found for this article");
    }

    articleDiscountFilter.articleId = article._id;
  }

  const articleDiscounts = await ArticleDiscount.find(articleDiscountFilter).select("discountId articleId").populate("articleId");
  const validDiscountIds = articleDiscounts.map(ad => ad.discountId);

  // Create filter discount
  const discountFilter: any = {
    startDate: { $gt: currentDate },
    $or: [
      { endDate: { $lt: currentDate } }, // Expired discounts
      { endDate: null }, // Discounts with no end date
    ],
  };

  if (criteria?.articleId) {
    discountFilter._id = { $in: validDiscountIds };
  }

  // Get all of the discounts params
  const discounts = await Discount.find(discountFilter).select("name description startDate endDate discountTypeId");

  const discountIds = discounts.map(d => d._id);
  const discountTypeIds = discounts.map(d => d.discountTypeId);

  const [
    discountTypes,
    discountTypeParameters,
    discountTypeParameterValues,
  ] = await Promise.all([
    DiscountType.find({ _id: { $in: discountTypeIds } }).select("name description"),
    DiscountTypeParameter.find({ discountTypeId: { $in: discountTypeIds } }).populate("type"),
    DiscountTypeParameterValue.find({ discountId: { $in: discountIds } })
  ]);

  // Get articleDiscounts even when articleId is not in criteria
  const filteredArticleDiscounts = criteria?.articleId
    ? articleDiscounts.filter(ad => validDiscountIds.includes(ad.discountId))
    : await ArticleDiscount.find({ discountId: { $in: discountIds } }).populate("articleId");

  // Map to DTOs
  const dtos: DiscountDTO[] = discounts.map(discount => {
    const dType = discountTypes.find(type => type._id.equals(discount.discountTypeId));

    if (!dType) {
      throw new Error(`Discount Type invalid: ${discount.discountTypeId} or not found`);
    }

    const dParams = discountTypeParameters.filter(param => param.discountTypeId.equals(dType._id));
    const dValues = discountTypeParameterValues.filter(value => value.discountId.equals(discount._id));
    const articles = filteredArticleDiscounts.filter(art => art.discountId.equals(discount._id));

    return {
      id: String(discount.id),
      name: discount.name,
      description: discount.description || "",
      articles: articles.map(a => ({
        id: String(a.articleId instanceof Article ? a.articleId.articleId : ""),
        price: a.price,
        quantity: a.quantity,
      })),
      discountType: {
        id: String(dType.id),
        name: dType.name,
        description: dType.description || "",
        parameters: dParams.map(param => ({
          id: String(param.id),
          name: param.name,
          dataTypeName: param.type instanceof DataType ? param.type.name : "",
          value: dValues.find(value => value.discountTypeParameterId.equals(param._id))?.value || "",
        })),
      },
      startDate: discount.startDate,
      endDate: discount.endDate,
    };
  });

  return dtos;
}

interface ValidateDiscountParametersProps {
  discountTypeId: string;
  parameterValues?: ParameterValueDTO[]
}

export async function validateDiscountParameters({
  discountTypeId,
  parameterValues = []
}: ValidateDiscountParametersProps) {
  // Fetch discount type and parameters in parallel
  const [discountType, discountTypeParameters] = await Promise.all([
    DiscountType.findById(discountTypeId),
    DiscountTypeParameter.find({ discountTypeId }).populate("type"),
  ]);

  // Check if discount type exists
  if (!discountType) {
    throw new NotFound(`DiscountType with ID ${discountTypeId} not found.`);
  }

  // Check that the correct number of parameters was provided
  if (discountTypeParameters.length !== parameterValues.length) {
    throw new BadRequest(
      `Invalid discount parameters for DiscountType ${discountType.name}. RequiredTypes: ${discountTypeParameters.map(d => d.name)}`
    );
  }

  // Validate that parameters ids and values
  discountTypeParameters.forEach(discountTypeParameter => {
    const providedParameter = parameterValues.find(p => p.id === discountTypeParameter.id);

    if (!providedParameter) {
      throw new BadRequest(
        `Invalid discount parameters. ${discountTypeParameter.name} is missing.`
      );
    }

    if (!discountTypeParameter.type || !(discountTypeParameter.type instanceof DataType)) {
      throw new Error(
        `Discount parameter ${discountTypeParameter.name} has an invalid type`
      );
    }

    const providedValue = providedParameter.value;
    const expectedType = discountTypeParameter.type.name;

    validateType(providedValue, expectedType);
  });
}
