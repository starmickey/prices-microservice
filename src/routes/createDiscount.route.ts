import { Request, Response } from "express";
import { ZodError } from "zod";
import { CreateDiscountSchema } from "../dtos/schemas/discountsSchemas";

export default function createDiscount(req: Request, res: Response) {
  try {
    const parsedRequest = CreateDiscountSchema.parse(req.body);

    res.status(201).send({ message: "success" });

  } catch (error) {
    if (error instanceof ZodError) {
      // Handle Zod validation errors
      res.status(400).json({ error: "Bad Request: " + error.errors.map((err) => err.message) });
      return;
    }

    console.error(error);

    if (error instanceof Error) {
      res.status(500).send({ error: error.message });
      return;
    }

    res.status(500).send({ error: "Internal server error." });
    return;
  }
}