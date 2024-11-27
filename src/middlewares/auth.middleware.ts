import { NextFunction, Request, Response } from "express";
import { getCurrentUser } from "../api/authApi";

export async function validateUserSignIn(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('bearer ')) {
      res.status(401).json({ message: "Authorization header is missing or is invalid" });
      return;
    }

    const token = authHeader.split(' ')[1];

    const { status } = await getCurrentUser(token);

    if (status === 200) {
      req.user = { token };
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Some problem occured while trying to validate the user" });
  }
} 