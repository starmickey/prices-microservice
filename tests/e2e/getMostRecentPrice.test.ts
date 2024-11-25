import { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { Article, ArticlePrice, ArticleState } from "../../src/prices/schema";
import { Config, getConfig } from "../../src/server/environment";
import { init as initExpress } from "../../src/server/express";

let app: Express;
let mongoServer: MongoMemoryServer;

beforeAll(async() => {
  // Start testing mongodb connection
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Init express
  const conf: Config = getConfig();
  app = initExpress(conf);

  // Create DB objects
  const articleState = await ArticleState.create({ name: "TAXED" });
  const article = await Article.create({ articleId: "test-article", stateId: articleState._id });
  await ArticlePrice.create({ articleId: article._id, price: 100, startDate: new Date() });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("GET /v1/prices/:articleId", () => {
  it("should return 400 if articleId is missing", async () => {
    const response = await request(app).get("/v1/prices");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Bad request: Missing article id.");
  });

  it("should return 400 if articleId is invalid", async () => {
    const response = await request(app).get("/v1/prices?articleId=");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid articleId. Must be an string.");
  });

  it("should return 200 and the price if articleId is valid", async () => {
    const response = await request(app).get(`/v1/prices?articleId=test-article`);

    expect(response.status).toBe(200);
    expect(response.body.articleId).toBe("test-article");
    expect(response.body.price).toBe(100);
  });

  it("should return 404 if article is not found", async () => {
    const response = await request(app).get(`/v1/prices?articleId=unexistent-article`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Article not found");
  });
});

