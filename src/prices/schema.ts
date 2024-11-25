"use strict";

import { Schema, model } from "mongoose";

// Article Schema
const ArticleSchema = new Schema({
  articleId: { type: String, trim: true, default: "", required: true },
  stateId: { type: Schema.Types.ObjectId, ref: 'ArticleState', required: true }, 
}, { timestamps: true });

// ArticleState Schema
const ArticleStateSchema = new Schema({
  name: { type: String, required: true }, // Example: 'TAXED', 'UNTAXED', 'DELETED'
  description: { type: String, default: "" },
  deleteDate: { type: Date, default: null },
}, { timestamps: true });

// ArticlePrice Schema
const ArticlePriceSchema = new Schema({
  price: { type: Number, required: true },
  startDate: { type: Date, required: true },
  articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true }, // Foreign key reference
}, { timestamps: true });

// Discount Schema
const DiscountSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  discountType: { type: String, required: true }, // Example: 'FIXED', 'PERCENTAGE'
}, { timestamps: true });

// ArticleDiscount Schema
const ArticleDiscountSchema = new Schema({
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true }, // Foreign key reference
  discountId: { type: Schema.Types.ObjectId, ref: 'Discount', required: true }, // Foreign key reference
}, { timestamps: true });

// DiscountType Schema
const DiscountTypeSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  endDate: { type: Date, default: null },
}, { timestamps: true });

// DiscountTypeParameter Schema
const DiscountTypeParameterSchema = new Schema({
  name: { type: String, required: true },
  deleteDate: { type: Date, default: null },
  discountTypeId: { type: Schema.Types.ObjectId, ref: 'DiscountType', required: true }, // Foreign key reference
  type: { type: Schema.Types.ObjectId, ref: 'Discount', required: true }, // Foreign key reference
}, { timestamps: true });

// DiscountTypeParameterValue Schema
const DiscountTypeParameterValueSchema = new Schema({
  value: { type: String, required: true },
  deleteDate: { type: Date, default: null },
  discountTypeParameterId: { type: Schema.Types.ObjectId, ref: 'DiscountTypeParameter', required: true }, // Foreign key reference
  discountId: { type: Schema.Types.ObjectId, ref: 'DataTypeSchema', required: true }, // Foreign key reference
}, { timestamps: true });

// DataType Schema
const DataTypeSchema = new Schema({
  name: { type: String, required: true }, // Example: 'STRING', 'INT', 'FLOAT'
  description: { type: String },
  deleteDate: { type: Date, default: null },
}, { timestamps: true });


// Export models
export const Article = model('Article', ArticleSchema);
export const ArticleState = model('ArticleState', ArticleStateSchema);
export const ArticlePrice = model('ArticlePrice', ArticlePriceSchema);
export const Discount = model('Discount', DiscountSchema);
export const ArticleDiscount = model('ArticleDiscount', ArticleDiscountSchema);
export const DiscountType = model('DiscountType', DiscountTypeSchema);
export const DiscountTypeParameter = model('DiscountTypeParameter', DiscountTypeParameterSchema);
export const DiscountTypeParameterValue = model('DiscountTypeParameterValue', DiscountTypeParameterValueSchema);
export const DataType = model('DataType', DataTypeSchema);
