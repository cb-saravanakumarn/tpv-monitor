// src/routes / sheetsRoutes.ts;
import { Router } from "express";
import { SheetsController } from "../controllers/sheetsController";

const router = Router();
const sheetsController = new SheetsController();

// Health check
router.get("/", sheetsController.getHealthCheck);

// Slack health check
router.get("/slack/health", sheetsController.getSlackHealthCheck);

// Get all sheet names from a spreadsheet
router.get("/sheets/:spreadsheetId", sheetsController.getSheetNames);

// Get ALL data from a sheet (all rows and columns) - MUST come before /:range
router.get("/sheets/:spreadsheetId/all", sheetsController.getAllSheetData);

// Get data with query parameters for filtering
router.get("/sheets/:spreadsheetId/data", sheetsController.getSheetData);

// Get data from a specific range - MUST come last
router.get("/sheets/:spreadsheetId/:range", sheetsController.getSheetRange);

export default router;
