import { z } from "zod";

export const ArticleSchema = z.string({ required_error: "ArticleId is missing", invalid_type_error: "ArticleId must be a string" })
  .min(1, { message: "ArticleId must have at least one character" });
