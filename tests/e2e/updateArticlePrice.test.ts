import { Express } from "express";
import moment from "moment";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { Article, ArticlePrice, ArticleState } from "../../src/models/models";
import { Config, getConfig } from "../../src/config";
import { initExpress } from "../../src/app";

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

  // Create nomenclator states
  const taxedState = new ArticleState({ articleStateId: "taxed-state", name: "TAXED", description: "On sale state" });
  const untaxedState = new ArticleState({ articleStateId: "untaxed-state", name: "UNTAXED", description: "On sale state" });
  
  await Promise.all([taxedState.save(), untaxedState.save()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Article.deleteMany({});
  await ArticlePrice.deleteMany({});
});

describe("POST /v1/prices/update", () => {

  it("updates successfully", async () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const tommorrowStr = date.toISOString();

    const response = await request(app)
      .post("/v1/prices/update")
      .send({ articleId: "123", price: 99.99, startDate: tommorrowStr });

    // console.log(response);
    expect(response.status).toBe(201);
  });

  it('should return 400 on no articleId', async () => {
    const response = await request(app)
      .post("/v1/prices/update")
      .send({ price: 99.99, startDate: new Date() });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Bad Request: ArticleId is missing"
    });
  });

  it('should return 400 on no price', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const tommorrowStr = date.toISOString();

    const response = await request(app)
      .post("/v1/prices/update")
      .send({ articleId: "123", startDate: tommorrowStr });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Bad Request: Price is missing"
    });
  });

  it('should return 201 on no start date', async () => {
    const response = await request(app)
      .post("/v1/prices/update")
      .send({ articleId: "123", price: 99.99 });

    expect(response.status).toBe(201);
  });

  it('should return 400 on old start date', async () => {
    const twoDaysAgo = moment().subtract(2, "days").format("YYYY-MM-DD");

    const response = await request(app)
      .post("/v1/prices/update")
      .send({ articleId: "123", price: 99.99, startDate: twoDaysAgo });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Bad Request: startDate must be a future date"
    });
  });
});

