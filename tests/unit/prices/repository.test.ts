import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  Article,
  ArticleState,
  ArticlePrice,
} from "../../../src/prices/schema";
import { getMostRecentArticlePrice } from "../../../src/prices/repository";
import { NotFound } from "../../../src/prices/exceptions";

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

describe('getArticlePrice', () => {
  it('should return the most recent price for the article', async () => {
    const articleState = await ArticleState.create({ name: "TAXED" });
    const article = await Article.create({ articleId: "test-article", stateId: articleState._id });
    await ArticlePrice.create({ articleId: article._id, price: 100, startDate: new Date() });

    const retrievedArticle = await getMostRecentArticlePrice("test-article");

    // expect(retrievedArticle).not.toBeNull();
    expect(retrievedArticle).toEqual(100);
  });

  it("should throw a NotFound error if the article does not exist", async () => {
    await expect(
      getMostRecentArticlePrice("unexistent-article")
    ).rejects.toThrow(NotFound);
  });

  it("should throw an error if the article state is not 'TAXED'", async () => {
    const articleState = await ArticleState.create({ name: "UNTAXED" });
    await Article.create({ articleId: "test-article", stateId: articleState._id });

    await expect(
      getMostRecentArticlePrice("test-article")
    ).rejects.toThrow("Article state is not 'TAXED'");
  });

  it("should throw an error if no price is found for the article", async () => {
    const articleState = await ArticleState.create({ name: "TAXED" });
    await Article.create({ articleId: "test-article", stateId: articleState._id });

    await expect(getMostRecentArticlePrice("test-article")).rejects.toThrow("No price information available for the article");
  });

  it("should throw an error if articleId is empty", async () => {
    await expect(getMostRecentArticlePrice("")).rejects.toThrow(TypeError);
    await expect(getMostRecentArticlePrice("")).rejects.toThrow("Missing articleId parameter");
  });
});

