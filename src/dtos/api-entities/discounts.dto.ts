export interface ParameterValueDTO {
  id: string;
  value: string | number;
}

export interface CreateDiscountDTO {
  name: string;
  description: string;
  articles?: {
    id: string;
    price: number;
    quantity: number;
  }[],
  discountTypeId: string;
  startDate: Date;
  endDate?: Date;
  parameterValues?: ParameterValueDTO[]
}