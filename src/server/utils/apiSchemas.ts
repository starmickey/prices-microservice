import { z } from "zod";

const currentDate = new Date();

export const ArticleSchema = z.string({ required_error: "ArticleId is missing", invalid_type_error: "ArticleId must be a string" })
.min(1, { message: "ArticleId must have at least one character" });

export const UpdateArticlePriceSchema = z.object({
  articleId: ArticleSchema,
  price: z.number({ required_error: "Price is missing", invalid_type_error: "Price must be a number" })
    .gt(0, { message: "Price must be greater than zero" }),
  startDate: z
  .preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional())
  .refine(
    (date) => {
      console.log("DATE", date);
      return !date || date >= currentDate
    },
    { message: "startDate must be a future date" }
  )
  .default(() => currentDate),
});
