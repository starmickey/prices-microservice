import { MongoError } from "mongodb";
import { Config, getConfig } from "./config";
import { initExpress } from "./app";
import mongoose from "mongoose";
import initialDataBaseConfig from "./config/initialDatabaseConfig";
import { Rabbit } from "./rabbitmq/rabbitConfig";

const conf: Config = getConfig();

Rabbit.getInstance();

// Print unhandled promises
process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
});

// Connect to MongoDB
mongoose.connect(conf.mongoPath, {}).then(() => {
  console.log("Connected to MongoDB");
  initialDataBaseConfig();
}).catch((error: MongoError) => {
  console.error("Error connecting to MongoDB: ", error);
});

// Start express
const app = initExpress(conf);

app.listen(conf.port, () => {
  console.log(`Prices server is listening on port ${conf.port}`);
});

