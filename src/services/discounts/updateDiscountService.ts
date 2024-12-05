import { z } from "zod";
import { UpdateDiscountSchema } from "../../dtos/schemas/discountsSchemas";
import { updateDiscount } from "../../repositories/discounts.repository";

export default async function updateDiscountService(params: z.infer<typeof UpdateDiscountSchema>) {
  const newDiscountId = await updateDiscount(params);
  return { ...params, discountId: newDiscountId };
}
