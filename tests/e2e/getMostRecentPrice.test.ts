import { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { Article, ArticlePrice, ArticleState } from "../../src/models/models";
import { Config, getConfig } from "../../src/config";
import { initExpress } from "../../src/app";
import moment from "moment";

let app: Express;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start testing mongodb connection
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Init express
  const conf: Config = getConfig();
  app = initExpress(conf);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {

})

describe("GET /v1/prices/:articleId", () => {
  it("should return 400 if articleId is missing", async () => {
    const response = await request(app).get("/v1/prices");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Bad Request: ArticleId is missing");
  });

  it("should return 400 if articleId is invalid", async () => {
    const response = await request(app).get("/v1/prices?articleId=");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Bad Request: ArticleId must have at least one character");
  });

  it("should return 200 and the most recent price if articleId is valid", async () => {
    const articleState = await ArticleState.create({ name: "TAXED" });
    const article = await Article.create({ articleId: "test-article", stateId: articleState._id });

    // Old price
    await ArticlePrice.create({ articleId: article._id, price: 100, startDate: moment().subtract(2, "days").toISOString()});
    // Current price
    await ArticlePrice.create({ articleId: article._id, price: 101, startDate: moment().subtract(1, "days").toISOString()});
    // Future price
    await ArticlePrice.create({ articleId: article._id, price: 102, startDate: moment().add(1, "days").toISOString()});

    const response = await request(app).get(`/v1/prices?articleId=test-article`);

    expect(response.status).toBe(200);
    expect(response.body.articleId).toBe("test-article");
    expect(response.body.price).toBe(101);
  });

  it("should return 404 if article is not found", async () => {
    const response = await request(app).get(`/v1/prices?articleId=unexistent-article`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Article not found");
  });
});

