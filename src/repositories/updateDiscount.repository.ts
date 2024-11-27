import { UpdateDiscountDTO } from "../dtos/api-entities/discounts.dto";
import { Discount } from "../models/models";
import { NotFound } from "../utils/exceptions";
import { createDiscount } from "./createDiscount.repository";

export default async function updateDiscountService (params: UpdateDiscountDTO) {
  const discount = await Discount.findById(params.id);

  if(!discount) {
    throw new NotFound(`Discount not found`);
  }

  const currentDate = new Date();

  if (!discount.endDate || discount.endDate > currentDate) {
    discount.endDate = currentDate;
    await discount.save();
  }

  return await createDiscount(params);
}