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

describe("POST /v1/discounts/create", () => {

  //   it("updates successfully", async () => {
  //     const response = await request(app)
  //       .post("/v1/prices/update")
  //       .send({ articleId: "123", price: 99.99, startDate: moment().add(1, "days").format("YYYY-MM-DD") });

  //     // console.log(response);
  //     expect(response.status).toBe(201);
  //   });

  it('should return 400 on missing parameters', async () => {
    const response = await request(app)
      .post("/v1/discounts/create")
      .send();

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Name is missing");
    expect(response.body.error).toContain("DiscountTypeId is missing");
  });

  it('should return 201 on missing optional parameters', async () => {
    const response = await request(app)
      .post("/v1/discounts/create")
      .send({ name: "test", articles: [{ id: "1", quantity: 1 }], discountTypeId: "1" });

    expect(response.status).toBe(201);
  });

});

