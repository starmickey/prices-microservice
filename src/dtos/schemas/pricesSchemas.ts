import { z } from "zod";
import { ArticleSchema } from "./articles.schemas";

export function parseGetArticlePriceSchema (params: any) {
  const GetArticlePriceSchema = z.object({
    articleId: ArticleSchema
  });
  return GetArticlePriceSchema.parse(params);
}

export function parseUpdateArticlePriceSchema(params: any) {
  const currentDate = new Date();

  const UpdateArticlePriceSchema = z.object({
    articleId: ArticleSchema,
    price: z
      .number({ required_error: "Price is missing", invalid_type_error: "Price must be a number" })
      .gt(0, { message: "Price must be greater than zero" }),
    startDate: z
      .preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional())
      .refine(
        // If it is defined, it should be greater than today
        (date) => !date || date >= currentDate,
        { message: "startDate must be a future date" }
      )
      .default(() => currentDate),
  });

  return UpdateArticlePriceSchema.parse(params);
}

