// src/controllers/sheetsController.ts
import { Request, Response } from "express";
import { GoogleSheetsService } from "../services/googleSheetsService";
import { SlackService } from "../services/slackService";
import {
  QueryParams,
  SheetResponse,
  DataResponse,
  SlackTableData,
} from "../types";

export class SheetsController {
  private sheetsService: GoogleSheetsService;
  private slackService: SlackService;

  constructor() {
    this.sheetsService = GoogleSheetsService.getInstance();
    this.slackService = SlackService.getInstance();
  }

  public getHealthCheck = (req: Request, res: Response): void => {
    res.json({
      message: "Google Sheets Express TypeScript API is running!",
      endpoints: {
        "GET /": "Health check",
        "GET /slack/health": "Slack connectivity check",
        "GET /sheets/:spreadsheetId": "Get all sheet names",
        "GET /sheets/:spreadsheetId/:range": "Get data from specific range",
        "GET /sheets/:spreadsheetId/data": "Get data with query parameters",
        "GET /sheets/:spreadsheetId/all":
          "Get ALL data from a sheet (all rows and columns) + Slack notification",
      },
      slack: {
        enabled: this.slackService.isEnabled(),
      },
    });
  };

  public getSlackHealthCheck = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      if (!this.slackService.isEnabled()) {
        res.json({
          success: false,
          message: "Slack notifications are disabled or not configured",
          enabled: false,
        });
        return;
      }

      const isConnected = await this.slackService.testConnection();

      if (isConnected) {
        res.json({
          success: true,
          message: "Slack connection is working properly",
          enabled: true,
          connected: true,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to connect to Slack",
          enabled: true,
          connected: false,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error testing Slack connection",
        enabled: this.slackService.isEnabled(),
        connected: false,
        error: error?.message || "Unknown error",
      });
    }
  };

  public getSheetNames = async (req: Request, res: Response): Promise<void> => {
    try {
      const { spreadsheetId } = req.params;

      if (!spreadsheetId) {
        res.status(400).json({
          success: false,
          error: "Spreadsheet ID is required",
        });
        return;
      }

      const result = await this.sheetsService.getSpreadsheetInfo(spreadsheetId);

      res.json({
        success: true,
        spreadsheetTitle: result.title,
        sheets: result.sheets,
      });
    } catch (error: any) {
      console.error("Error fetching sheet names:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch sheet names",
        details: error?.message || "Unknown error",
      });
    }
  };

  public getSheetRange = async (req: Request, res: Response): Promise<void> => {
    try {
      const { spreadsheetId, range } = req.params;
      const {
        valueRenderOption = "FORMATTED_VALUE",
        dateTimeRenderOption = "FORMATTED_STRING",
      } = req.query as any;

      if (!spreadsheetId || !range) {
        res.status(400).json({
          success: false,
          error: "Spreadsheet ID and range are required",
        });
        return;
      }

      const decodedRange = decodeURIComponent(range);
      const rows = await this.sheetsService.getSheetData(
        spreadsheetId,
        decodedRange,
        { valueRenderOption, dateTimeRenderOption }
      );

      let data: any = rows;
      if (rows.length > 0) {
        const headers = rows[0];
        const objects = this.sheetsService.convertToObjects(rows);

        data = {
          headers,
          rows: rows.slice(1),
          objects,
        };
      }

      res.json({
        success: true,
        range: decodedRange,
        rowCount: rows.length,
        data,
      });
    } catch (error: any) {
      console.error("Error fetching data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch data",
        details: error?.message || "Unknown error",
      });
    }
  };

  public getSheetData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { spreadsheetId } = req.params;
      const {
        sheet = "Sheet1",
        startRow = "1",
        endRow,
        startCol = "A",
        endCol,
        format = "objects",
      } = req.query as any;

      if (!spreadsheetId) {
        res.status(400).json({
          success: false,
          error: "Spreadsheet ID is required",
        });
        return;
      }

      // Build range string
      let range = sheet;
      if (startRow || endRow || startCol || endCol) {
        range += "!";
        range += startCol || "A";
        range += startRow || "1";
        if (endCol || endRow) {
          range += ":";
          range += endCol || "";
          range += endRow || "";
        }
      }

      const rows = await this.sheetsService.getSheetData(spreadsheetId, range);

      const responseData: any = {};

      if (format === "raw" || format === "both") {
        responseData.raw = rows;
      }

      if ((format === "objects" || format === "both") && rows.length > 0) {
        responseData.objects = this.sheetsService.convertToObjects(rows);
        responseData.headers = rows[0];
      }

      res.json({
        success: true,
        range,
        rowCount: rows.length,
        data: responseData,
      });
    } catch (error: any) {
      console.error("Error fetching data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch data",
        details: error?.message || "Unknown error",
      });
    }
  };

  public getAllSheetData = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { spreadsheetId } = req.params;
      const { sheet = "Sheet1", includeEmpty = "false" } = req.query as any;

      if (!spreadsheetId) {
        res.status(400).json({
          success: false,
          error: "Spreadsheet ID is required",
        });
        return;
      }

      const result = await this.sheetsService.getAllSheetData(
        spreadsheetId,
        sheet
      );

      // Filter out completely empty rows if includeEmpty is false
      let filteredData = result.data;
      let filteredObjects = result.objects;

      if (includeEmpty === "false" && result.data.length > 0) {
        // Keep header row and rows with at least one non-empty cell
        filteredData = result.data.filter((row, index) => {
          if (index === 0) return true; // Always keep header row
          return (
            row && row.some((cell) => cell && cell.toString().trim() !== "")
          );
        });

        // Filter objects similarly
        filteredObjects = result.objects.filter((obj) =>
          Object.values(obj).some(
            (value) => value && value.toString().trim() !== ""
          )
        );
      }

      // Calculate actual data dimensions
      const actualDataRows = filteredData.length;
      const actualDataColumns =
        filteredData.length > 0
          ? Math.max(...filteredData.map((row) => row.length))
          : 0;

      const responseData = {
        success: true,
        spreadsheetId,
        sheetName: result.sheetName,
        totalRows: result.totalRows,
        totalColumns: result.totalColumns,
        actualDataRows,
        actualDataColumns,
        data: {
          headers: result.headers,
          raw: filteredData,
          objects: filteredObjects,
          metadata: {
            hasHeaders: actualDataRows > 0,
            gridColumnCount: result.totalColumns,
            gridRowCount: result.totalRows,
            dataRows: actualDataRows,
            dataColumns: actualDataColumns,
            nonEmptyRows: Math.max(0, actualDataRows - 1), // Exclude header
            lastDataColumn:
              actualDataColumns > 0
                ? this.getLastColumn(actualDataColumns)
                : "A",
            effectiveRange:
              actualDataRows > 0 && actualDataColumns > 0
                ? `${result.sheetName}!A1:${this.getLastColumn(
                    actualDataColumns
                  )}${actualDataRows}`
                : `${result.sheetName}!A1:A1`,
          },
        },
      };

      // Send Slack notification (async, don't wait for it)
      this.sendSlackNotification(spreadsheetId, result, filteredData);

      res.json(responseData);
    } catch (error: any) {
      console.error("Error fetching all sheet data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch all sheet data",
        details: error?.message || "Unknown error",
      });
    }
  };

  private getLastColumn(columnNumber: number): string {
    let result = "";
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode(65 + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }

  /**
   * Send Slack notification with spreadsheet data
   */
  private async sendSlackNotification(
    spreadsheetId: string,
    result: any,
    filteredData: string[][]
  ): Promise<void> {
    try {
      if (!this.slackService.isEnabled()) {
        return;
      }

      // Prepare data for Slack
      const slackData: SlackTableData = {
        headers: result.headers,
        rows: filteredData.slice(1), // Exclude header row from data rows
        metadata: {
          spreadsheetId,
          sheetName: result.sheetName,
          totalRows: result.totalRows,
          actualDataRows: Math.max(0, filteredData.length - 1), // Exclude header from count
        },
      };

      // Send notification with options
      await this.slackService.sendSpreadsheetNotification(slackData, {
        includeMetadata: true,
        maxRows: 25, // Limit to 25 rows to avoid message being too long
      });
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
      // Don't throw error - we don't want to break the API response
    }
  }
}
