import { CreateDiscountDTO, UpdateDiscountDTO, ParameterValueDTO } from "../dtos/api-entities/discounts.dto";
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
    discountType: params.discountTypeId,
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