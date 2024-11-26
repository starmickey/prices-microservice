import { Response } from "express";
import { APIError } from "./exceptions";
import { ZodError } from "zod";

export default function getErrorResponse(error: any, res: Response) {
  if (error instanceof ZodError) {
    const errors = error.errors.map((err) => err.message);
    res.status(400).json({ error: "Bad Request: " + errors });
    return;
  } 
  
  if (error instanceof APIError) {
    const { status, message } = error;
    return res.status(status).json({ error: message });
  }

  if (error instanceof Error ) {
    const { message } = error;
    return res.status(500).json({ error: message });
  }

  return res.status(500).send({ error: "Internal server error." });
}