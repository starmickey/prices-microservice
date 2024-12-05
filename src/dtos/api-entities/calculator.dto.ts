import { CartItem } from "./cart.dto";

export interface CalculateCartCostDTO {
  articles: CartItem[];
  discounts?: {
    id: string;
    parameters?: {
      id: string;
      value: string | number;
    }[];
  }[];
}
