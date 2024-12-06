import { Request, Response } from "express";
import getErrorResponse from "../utils/getErrorResponse";
import { CalculateCartCostSchema } from "../dtos/schemas/calculate.schemas";
import getCartCostService from "../services/getCartCost";
import { Types } from "mongoose";
import { BadRequest } from "../utils/exceptions";

export async function getCartCost(req: Request, res: Response) {
  try {
    const params = CalculateCartCostSchema.parse(req.body);

    // Validate mongoose ids
    if (params.discounts) {
      params.discounts.forEach(discount => {
        if (!Types.ObjectId.isValid(discount.id)) {
          throw new BadRequest('Invalid DiscountId');
        }

        if(discount.parameters) {
          discount.parameters.forEach(parameter => {
            if (!Types.ObjectId.isValid(parameter.id)) {
              throw new BadRequest('Invalid Parameterid');
            }
          })
        }
      });
    }

    const response = await getCartCostService(params);

    res.status(200).json({ response });
  } catch (error) {
    getErrorResponse(error, res);
  }
}