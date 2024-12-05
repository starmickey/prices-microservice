import { z } from "zod";

export const CalculateCartCostSchema = z.object({
  articles: z
    .array(
      z.object({
        articleId: z
          .string({ required_error: "ArticleId is missing", invalid_type_error: "ArticleId must be a string" })
          .min(1, { message: "ArticleId must have at least one character" }),
        quantity: z
          .number({ required_error: "Quantity is missing", invalid_type_error: "Quantity must be a number" })
          .gt(0, { message: "Quantity must be greater than zero" }),
      }, { required_error: "Param articles is missing", invalid_type_error: "Article invalid" }),
      { required_error: "Articles array is missing", invalid_type_error: "Some article has an invalid type" })
    .min(1, "At least one article should be provided"),
  discounts: z
    .array(
      z.object({
        id: z
          .string({ required_error: "Some discount id is missing", invalid_type_error: "Discount ids must be strings" })
          .min(1, { message: "Discount ids must have at least one character" }),
        parameters: z
          .array(
            z.object({
              id: z
                .string({ required_error: "Some parameter id is missing", invalid_type_error: "Parameter ids must be strings" })
                .min(1, { message: "Parameter ids must have at least one character" }),
              value: z
                .union([z.string(), z.number()], { required_error: "A parameter value is missing", invalid_type_error: "Every parameterValues value must be a string or a number" })
                .refine(value => typeof value === "string" || typeof value === "number", {
                  message: "Every parameter value must be a string or a number",
                })
                .refine(value => typeof value === "string" ? value.length > 0 : true, {
                  message: "value must not be an empty string"
                })
            }, { invalid_type_error: "Some parmeter has invalid types" }))
          .optional()
      }, { invalid_type_error: "Some discount has invalid type" }),
      { invalid_type_error: "Discounts array has an invalid type" })
    .optional()
})