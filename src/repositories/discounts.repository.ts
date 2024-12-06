import { Types } from "mongoose";
import { CreateDiscountDTO, UpdateDiscountDTO, ParameterValueDTO, DiscountResumeDTO } from "../dtos/api-entities/discounts.dto";
import { Article, ArticleDiscount, ArticlePrice, ArticleState, DataType, Discount, DiscountType, DiscountTypeParameter, DiscountTypeParameterValue } from "../models/models";
import { validateType } from "../utils/dataTypeValidator";
import { BadRequest, NotFound } from "../utils/exceptions";

/*
 *  ================================================================
 *  
 *                   D I S C O U N T S     A B M
 *  
 *  ================================================================
 */

/**
 * Creates a new discount and associates it with articles and discount parameters.
 * 
 * @param {CreateDiscountDTO} params - The data needed to create a new discount, including articles and parameters.
 * @returns {Promise<DiscountResumeDTO>} - Discount details
 * @throws {BadRequest} - If any article IDs do not exist or if there are validation issues with parameters.
 */
export async function createDiscount(params: CreateDiscountDTO): Promise<DiscountResumeDTO> {
  // Validate that all of the articles exist in the database
  const articleIds = params.articles?.map(a => a.id) || [];
  const articles = await Article.find({ articleId: { $in: articleIds } }).select("id articleId").populate("stateId");

  if (articleIds.length !== articles.length) {
    const foundArticleIds = articles.map((article) => article.articleId);
    const missingArticleIds = articleIds.filter((id) => !foundArticleIds.includes(id));

    throw new BadRequest(`The following articleIds do not exist: ${missingArticleIds.join(", ")}`);
  }

  // Validate that all articles have been taxed
  articles.forEach(article => {
    if (!(article.stateId instanceof ArticleState)) throw new Error(`Couldn't populate the state of the article whose id is: ${article.articleId}`);
    if (article.stateId.name !== "TAXED") throw new BadRequest(`Article of id ${article.articleId} has state ${article.stateId.name}`)
  });

  // Validate that required parameters where provided and they are valid
  await validateDiscountParameters(params);

  // Create entities
  const discount = new Discount({
    name: params.name,
    description: params.description || "",
    startDate: params.startDate || new Date(),
    endDate: params.endDate || null,
    discountTypeId: params.discountTypeId,
    baseDiscountedAmount: params.baseDiscountedAmount
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
  const [articleDiscounts, discountValues] = await Promise.all([
    Promise.all(articleDiscountPromises), // Wait for all ArticleDiscount saves
    Promise.all(paramValuesPromises) // Wait for all DiscountTypeParameterValue saves
  ]);

  const dto: DiscountResumeDTO = {
    id: discount._id.toString(),
    name: discount.name,
    description: discount.description || "",
    articles: articleDiscounts.map(ad => ({
      id: ad._id.toString(),
      price: ad.price,
      quantity: ad.quantity,
    })),
    baseDiscountedAmount: discount.baseDiscountedAmount,
    discountTypeId: discount.discountTypeId.toString(),
    startDate: discount.startDate,
    endDate: discount.endDate,
    parameterValues: discountValues.map(parameterValue => ({
      parameterId: parameterValue.discountTypeParameterId.toString(),
      value: parameterValue.value
    }))
  };

  return dto;
}


/**
 * Updates a discount by disabling it (endDate = now) and creates a new one.
 * 
 * @param {UpdateDiscountDTO} params - The data needed to create a new discount, including articles and parameters.
 * @returns {Promise<DiscountResumeDTO>} - Discount details
 * @throws {NotFound}" - If any article IDs do not exist or if there are validation issues with parameters.
 */
export async function updateDiscount(params: UpdateDiscountDTO): Promise<DiscountResumeDTO> {
  const discount = await Discount.findById(params.id);
  if (!discount) throw new NotFound(`Discount not found`);

  const currentDate = new Date();

  if (!discount.endDate || discount.endDate > currentDate) {
    discount.endDate = currentDate;
    const res = await discount.save();
  }

  return await createDiscount(params);
}


/**
 * Disables a discount: setsEndDate to now
 * 
 * @param {string} discountId - The discount id
 * @throws {NotFound} - If the discount doesn't exist
 * @throws {BadRequest} - If it was already disabled
 */
export async function deleteDiscount(discountId: string): Promise<void> {
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

/**
 * Utility function created to validate a discount.
 * This means that all the parameters required by the specified discountType are provided,
 * and for each of them is also provided a value that has the right DataType
 * 
 * @param {string} discountTypeId - id of the DiscountType. For example, a combo or a coupon
 * @param {ParameterValueDTO[]} [parameterValues] - the values that were provided to the discount. For example,
 * if discountType = coupon, a coupon code must be provided
 * @throws {Error} - if some validation is not passed
 * @throws {NotFound} - if no DiscountType was found whose id is the provided one
 * @return {void}
 */
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
    throw new BadRequest(`Invalid discount parameters for DiscountType ${discountType.name}. RequiredTypes: ${discountTypeParameters.map(d => d.name)}`);
  }

  // Validate that parameters ids and values
  discountTypeParameters.forEach(discountTypeParameter => {
    const providedParameter = parameterValues.find(p => p.id === discountTypeParameter.id);

    if (!providedParameter) {
      throw new BadRequest(`Invalid discount parameters. ${discountTypeParameter.name} is missing.`);
    }

    if (!discountTypeParameter.type || !(discountTypeParameter.type instanceof DataType)) {
      throw new Error(`Discount parameter ${discountTypeParameter.name} has an invalid type`);
    }

    const providedValue = providedParameter.value;
    const expectedType = discountTypeParameter.type.name;

    validateType(providedValue, expectedType);
  });
}

/*
 *  ================================================================
 *  
 *              D I S C O U N T S     P R O V I D E R S
 *  
 *  ================================================================
 */

/**
 * Gets all of the discounts whose startDate has passed and endDate
 * hasn't passed or is null
 * 
 * @param filter - Used to expand the restrictions on the Discount.find query
 * @returns {Promise<Discount[]>}
 */
export async function findValidDiscounts(filter: any): Promise<any[]> {
  const currentDate = new Date();

  const discountFilter: any = {
    startDate: { $lte: currentDate },
    $or: [
      { endDate: { $gt: currentDate } },
      { endDate: null },
    ],
    ...filter
  };

  return Discount.find(discountFilter).select("name description startDate endDate discountTypeId baseDiscountedAmount");
}

/**
 * Gets all of the valid discounts that are not related to any article
 * 
 * @return {Promise<Discount[]>}
*/
export async function getDiscountsWithoutArticles(): Promise<any[]> {
  const currentDate = new Date(); // Get the current date and time

  const discountsWithoutArticles = await Discount.aggregate([
    {
      $lookup: {
        from: "articlediscounts", // Collection name of ArticleDiscount
        localField: "_id",
        foreignField: "discountId",
        as: "relatedArticles",
      },
    },
    {
      $match: {
        relatedArticles: { $size: 0 }, // Filter discounts with no related articles
        startDate: { $lte: currentDate }, // Discount's startDate should have passed
        $or: [
          { endDate: { $gte: currentDate } }, // Discount's endDate should be in the future or null
          { endDate: { $exists: false } }, // Discounts with no endDate
        ],
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        startDate: 1,
        endDate: 1,
        discountTypeId: 1,
      },
    },
  ]);

  return discountsWithoutArticles;
}


/*
 *  ================================================================
 *  
 *              I N T E R M I D I A T E    C L A S E S
 *  
 *  ================================================================
 */
export async function getArticleDiscounts(filter: any) {
  return ArticleDiscount.find(filter).select("discountId articleId price quantity").populate("articleId");
}

export async function findDiscountTypes(discountTypeIds: Types.ObjectId[]) {
  return DiscountType.find({ _id: { $in: discountTypeIds } }).select("name description");
}

export async function findDiscountTypeParameters(discountTypeIds: Types.ObjectId[]) {
  return DiscountTypeParameter.find({ discountTypeId: { $in: discountTypeIds } }).populate("type");
}

export async function findDiscountTypeParameterValues(discountIds: Types.ObjectId[]) {
  return DiscountTypeParameterValue.find({ discountId: { $in: discountIds } });
}

export async function findFilteredArticleDiscounts(discountIds: Types.ObjectId[]) {
  return ArticleDiscount.find({ discountId: { $in: discountIds } }).populate("articleId");
}

export async function getDiscountsValues(discounts: any[]) {
  const discountIds = discounts.map(d => d._id);
  return DiscountTypeParameterValue.find({ discountId: { $in: discountIds } });
}