import { z } from "zod";
import { ArticleSchema } from "./articles.schemas";

const currentDate = new Date();

export const GetArticlePriceSchema = z.object({
  articleId: ArticleSchema
});

export const UpdateArticlePriceSchema = z.object({
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
