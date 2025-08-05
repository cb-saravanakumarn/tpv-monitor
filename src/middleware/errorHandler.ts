// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { config } from "../config/environment";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    error: "Something went wrong!",
    details: config.nodeEnv === "development" ? err.message : undefined,
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
};
