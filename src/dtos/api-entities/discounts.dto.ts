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

export interface UpdateDiscountDTO extends CreateDiscountDTO{
  id: string;
}

export interface DiscountDTO {
  id: string;
  name: string;
  description: string;
  articles: {
    id: string;
    price: number;
    quantity: number;
  }[],
  discountType: {
    id: string;
    name: string;
    description: string;
    parameters: {
      id: string;
      name: string;
      dataTypeName: string;
      value: string;
    }[]
  };
  startDate: Date;
  endDate?: Date;
}