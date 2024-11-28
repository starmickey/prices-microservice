import { z } from "zod";
import { ArticleSchema } from "./articles.schemas";

const currentDate = new Date();

export const DiscountSchema = z.object({
  name: z
    .string({ required_error: "Name is missing", invalid_type_error: "Name must be a string" })
    .min(1, { message: "Name must have at least one character" }),
  description: z
    .string({ invalid_type_error: "Description must be a string" })
    .optional()
    .default(""),
  articles: z
    .array(
      z.object({
        id: z
          .string({ required_error: "An article id is missing", invalid_type_error: "Article id invalid type. It must be a string" })
          .min(1, { message: "Article ids must have at least one character" }),
        price: z
          .number({ required_error: "Price is missing", invalid_type_error: "Price must be a number" })
          .gt(0, { message: "Price must be greater than zero" }),
        quantity: z
          .number({ required_error: "Quantity is missing", invalid_type_error: "Quantity must be a number" })
          .gt(0, { message: "Quantity must be greater than zero" }),
      }, { invalid_type_error: "Article invalid" }))
    .optional(),
  discountTypeId: z
    .string({ required_error: "DiscountTypeId is missing", invalid_type_error: "DiscountTypeId must be a string" })
    .min(1, { message: "DiscountTypeId must have at least one character" }),
  startDate: z
    .preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional())
    .refine(
      // If it is defined, it should be greater than today
      (date) => !date || date >= currentDate,
      { message: "startDate must be a future date" }
    )
    .optional()
    .default(() => currentDate),
  endDate: z
    .preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional())
    .refine(
      // If it is defined, it should be greater than today
      (date) => !date || date >= currentDate,
      { message: "endDate must be a future date" }
    ),
  parameterValues: z.array(
    z.object({
      id: z
        .string({ required_error: "A parameter id is missing", invalid_type_error: "A parameter id invalid type. It must be a string" })
        .min(1, { message: "Parameters ids must have at least one character" }),
      value: z
        .union([z.string(), z.number()], { required_error: "A parameter value is missing", invalid_type_error: "Every parameterValues value must be a string or a number" })
        .refine(value => typeof value === "string" || typeof value === "number", {
          message: "Every parameter value must be a string or a number",
        })
        .refine(value => typeof value === "string" ? value.length > 0 : true, {
          message: "value must not be an empty string"
        })
    })
  )
    .optional()
})

export const CreateDiscountSchema = DiscountSchema
  .extend({})
  .refine(
    (data) => !data.endDate || !data.startDate || data.endDate > data.startDate,
    { message: "endDate must be after startDate", path: ["endDate"] }
  );

export const UpdateDiscountSchema = DiscountSchema
  .extend({
    id: z
      .string({ required_error: "Discount id is missing", invalid_type_error: "Discount id invalid. It must be a string" })
      .min(1, { message: "Discount id must have at least one character" })
  })
  .refine(
    (data) => !data.endDate || !data.startDate || data.endDate > data.startDate,
    { message: "endDate must be after startDate", path: ["endDate"] }
  );

export const DeleteDiscountSchema = z.object({
  id: z
    .string({ required_error: "Discount id is missing", invalid_type_error: "Discount id invalid. It must be a string" })
    .min(1, { message: "Discount id must have at least one character" })
})

export const GetArticleDiscountSchema = z.object({
  articleId: ArticleSchema.optional()
});