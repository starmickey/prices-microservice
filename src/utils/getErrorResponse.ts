import { Response } from "express";
import { APIError } from "./exceptions";
import { ZodError } from "zod";

export default function getErrorResponse(error: any, res: Response) {
  if (error instanceof ZodError) {
    const errors = error.errors.map((err) => err.message);
    
    console.warn(`[${new Date().toISOString()}] BAD REQUEST: ${errors}`);
    res.status(400).json({ error: "Bad Request: " + errors });
    return;
  }

  if (error instanceof APIError) {
    const { status, message, name } = error;

    console.warn(`[${new Date().toISOString()}] WARNING ${status} ${name}: ${message}`);
    return res.status(status).json({ error: message });
  }


  if (error instanceof Error) {
    const { message } = error;

    console.error(`[${new Date().toISOString()}] SERVER ERROR: ${message}`);
    return res.status(500).json({ error: message });
  }

  console.error(`[${new Date().toISOString()}] SERVER ERROR: `, error);

  return res.status(500).send({ error: "Internal server error." });
}