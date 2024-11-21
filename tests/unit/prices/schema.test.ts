import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  Article,
  ArticleState,
  ArticlePrice,
  Discount,
  ArticleDiscount,
  DiscountType,
  DiscountTypeParameter,
  DiscountTypeParameterValue,
  DataType,
} from "../../../src/prices/schema";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (collections[key]) {
      await collections[key].deleteMany({});
    }
  }
});

describe("Schema Models", () => {
  it("should create and validate ArticleState successfully", async () => {
    const articleState = await ArticleState.create({
      articleStateId: "state-001",
      name: "TAXED",
      description: "Taxed state",
    });

    expect(articleState).toHaveProperty("_id");
    expect(articleState.name).toBe("TAXED");
    expect(articleState.description).toBe("Taxed state");
  });

  it("should fail validation for missing required fields in ArticleState", async () => {
    try {
      await ArticleState.create({});
    } catch (error) {
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      const validationError = error as mongoose.Error.ValidationError;
      expect(validationError.errors).toHaveProperty("articleStateId");
      expect(validationError.errors).toHaveProperty("name");
    }
  });

  it("should create and validate Article successfully with ArticleState reference", async () => {
    const articleState = await ArticleState.create({
      articleStateId: "state-002",
      name: "UNTAXED",
      description: "Untaxed state",
    });

    const article = await Article.create({
      articleId: "article-001",
      stateId: articleState._id,
    });

    expect(article).toHaveProperty("_id");
    expect(article.articleId).toBe("article-001");
    expect(article.stateId.toString()).toBe(articleState._id.toString());
  });

  it("should create and validate ArticlePrice successfully with Article reference", async () => {
    const articleState = await ArticleState.create({
      articleStateId: "state-003",
      name: "ACTIVE",
      description: "Active state",
    });

    const article = await Article.create({
      articleId: "article-002",
      stateId: articleState._id,
    });

    const articlePrice = await ArticlePrice.create({
      articlePriceId: "price-001",
      price: 100.5,
      startDate: new Date(),
      articleId: article._id,
    });

    expect(articlePrice).toHaveProperty("_id");
    expect(articlePrice.price).toBe(100.5);
    expect(articlePrice.articleId.toString()).toBe(article._id.toString());
  });

  it("should create and validate Discount successfully", async () => {
    const discount = await Discount.create({
      discountId: "discount-001",
      name: "Summer Sale",
      description: "15% off during summer",
      startDate: new Date(),
      discountType: "PERCENTAGE",
    });

    expect(discount).toHaveProperty("_id");
    expect(discount.name).toBe("Summer Sale");
    expect(discount.discountType).toBe("PERCENTAGE");
  });

  it("should create and validate ArticleDiscount with Article and Discount references", async () => {
    const discount = await Discount.create({
      discountId: "discount-002",
      name: "Winter Sale",
      description: "10% off during winter",
      startDate: new Date(),
      discountType: "PERCENTAGE",
    });

    const articleState = await ArticleState.create({
      articleStateId: "state-004",
      name: "ON SALE",
      description: "On sale state",
    });

    const article = await Article.create({
      articleId: "article-003",
      stateId: articleState._id,
    });

    const articleDiscount = await ArticleDiscount.create({
      articleDiscountId: "art-disc-001",
      price: 50,
      quantity: 2,
      articleId: article._id,
      discountId: discount._id,
    });

    expect(articleDiscount).toHaveProperty("_id");
    expect(articleDiscount.price).toBe(50);
    expect(articleDiscount.articleId.toString()).toBe(article._id.toString());
    expect(articleDiscount.discountId.toString()).toBe(discount._id.toString());
  });

  it("should validate DiscountType with DiscountTypeParameter and their values", async () => {
    const discountType = await DiscountType.create({
      discountTypeId: "type-001",
      name: "Seasonal Discount",
      description: "Applies to specific seasons",
    });

    const dataType = await DataType.create({
      dataTypeId: "data-type-001",
      name: "STRING", 
      description: "used for strings",
    });

    const discountTypeParameter = await DiscountTypeParameter.create({
      discountTypeParameterId: "param-001",
      name: "Season",
      discountTypeId: discountType._id,
      type: dataType._id,
    });

    const discountTypeParameterValue = await DiscountTypeParameterValue.create({
      discountTypeParameterValueId: "param-value-001",
      value: "Summer",
      discountTypeParameterId: discountTypeParameter._id,
      discountId: new Types.ObjectId(), // Mocked Discount reference
    });

    expect(discountTypeParameterValue).toHaveProperty("_id");
    expect(discountTypeParameterValue.value).toBe("Summer");
    expect(discountTypeParameterValue.discountTypeParameterId.toString()).toBe(
      discountTypeParameter._id.toString()
    );
  });
});
