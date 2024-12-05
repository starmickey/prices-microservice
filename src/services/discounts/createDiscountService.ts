import { z } from "zod";
import { CreateDiscountSchema } from "../../dtos/schemas/discountsSchemas";
import { createDiscount } from "../../repositories/discounts.repository";

export default async function createDiscountService(params: z.infer<typeof CreateDiscountSchema>) {
  const discountId = await createDiscount(params);
  return { discountId, ...params };
}