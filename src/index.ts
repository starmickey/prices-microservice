import { MongoError } from "mongodb";
import { Config, getConfig } from "./server/environment";
import { init } from "./server/express";
import mongoose from "mongoose";

const conf: Config = getConfig();

const app = init(conf);

mongoose.connect(conf.mongoPath, {}).then(() => {
  console.log("Connected to MongoDB");
}).catch((error: MongoError) => {
  console.error("Error connecting to MongoDB: ", error);
});

app.listen(conf.port, () => {
  console.log(`Prices server is listening on port ${conf.port}`);
});
