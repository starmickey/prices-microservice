import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { ObjectId } from "mongoose";
import { Article, ArticlePrice, ArticleState } from "../../../src/prices/schema";
import { updateArticlePriceService } from "../../../src/prices/updateArticlePriceService";

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
  await Article.deleteMany({});
  await ArticleState.deleteMany({});
  await ArticlePrice.deleteMany({});
});

const createArticle = (articleId: string, stateId: any) => Article.create({ articleId, stateId });

const createTaxedState = () => ArticleState.create({ articleStateId: "taxed-state", name: "TAXED", description: "On sale state" });

const createUntaxedState = () => ArticleState.create({ articleStateId: "taxed-state", name: "UNTAXED", description: "On sale state" });

describe('Update Article Price tests', () => {

  it('creates an article if it doesnt exist', async () => {
    await createTaxedState();
    await updateArticlePriceService({ articleId: "newarticle", price: 10, startDate: new Date() });

    const article = Article.findOne({ articleId: "newarticle" });
    expect(article).toBeDefined();
  });

  it('updates its state if it exists', async () => {
    const untaxedState = await createUntaxedState();
    const taxedState = await createTaxedState();
    const article = await createArticle("test-article", untaxedState._id);

    await updateArticlePriceService({ articleId: article.articleId, price: 10, startDate: new Date() });
    
    const retrievedArticle = await Article.findOne({ articleId: article.articleId });
    expect(retrievedArticle?.stateId).toEqual(taxedState._id);
  });

  it('creates an articlePrice', async () => {
    await createTaxedState();
    await updateArticlePriceService({ articleId: "test-article", price: 10, startDate: new Date() });

    const price = await ArticlePrice.findOne({price: 10});
    expect(price).toBeDefined();
  });

  it('throws if taxed state doesnt exist', async () => {
    await expect(
      updateArticlePriceService({ articleId: "test-article", price: 10, startDate: new Date() })
    ).rejects.toThrow("Article state 'TAXED' not found");
  });
});