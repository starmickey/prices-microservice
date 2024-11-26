import { z } from "zod";

const currentDate = new Date();

export const CreateDiscountSchema = z.object({
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
        quantity: z
          .number({ required_error: "Quantity is missing", invalid_type_error: "Quantity must be a number" })
          .gt(0, { message: "Quantity must be greater than zero" }),
      }, { required_error: "Articles array is missing", invalid_type_error: "Article invalid" }))
    .min(1, { message: "Provide at least one article" }),
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
      value: z.string()
    })
  )
    .optional()
})
  .refine(
    (data) => !data.endDate || !data.startDate || data.endDate > data.startDate,
    { message: "endDate must be after startDate", path: ["endDate"] }
  );