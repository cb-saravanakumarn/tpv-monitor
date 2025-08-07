// src/services/googleSheetsService.ts
import { google, sheets_v4 } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import * as fs from "fs";
import { GoogleServiceAccountCredentials } from "../types";
import { config } from "../config/environment";

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private sheetsAPI: sheets_v4.Sheets | null = null;
  private readonly SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
  ];

  private constructor() {}

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  private async initializeAuth(): Promise<sheets_v4.Sheets> {
    if (this.sheetsAPI) {
      return this.sheetsAPI;
    }

    try {
      let auth: GoogleAuth;

      // Try to use service account key file if provided and it exists
      if (
        config.google.serviceAccountKeyFile &&
        fs.existsSync(config.google.serviceAccountKeyFile)
      ) {
        try {
          // Check if the file has valid JSON content
          const keyFileContent = fs.readFileSync(
            config.google.serviceAccountKeyFile,
            "utf8"
          );
          const parsedKey = JSON.parse(keyFileContent);

          // Only use key file if it has required fields
          if (
            parsedKey.type &&
            parsedKey.private_key &&
            parsedKey.client_email
          ) {
            auth = new google.auth.GoogleAuth({
              keyFile: config.google.serviceAccountKeyFile,
              scopes: this.SCOPES,
            });
          } else {
            throw new Error("Invalid key file format");
          }
        } catch (error) {
          console.warn(
            "Service account key file is invalid, falling back to environment variables"
          );
          // Fall through to use environment variables
          auth = this.createAuthFromEnvVars();
        }
      } else {
        auth = this.createAuthFromEnvVars();
      }

      const authClient = await auth.getClient();
      this.sheetsAPI = google.sheets({
        version: "v4",
        auth: authClient as any,
      });

      return this.sheetsAPI;
    } catch (error) {
      throw new Error(
        `Failed to initialize Google Sheets authentication: ${error}`
      );
    }
  }

  private createAuthFromEnvVars(): GoogleAuth {
    // Use individual environment variables
    const serviceAccountKey: GoogleServiceAccountCredentials = {
      type: "service_account",
      project_id: config.google.projectId!,
      private_key_id: config.google.privateKeyId!,
      private_key: config.google.privateKey!,
      client_email: config.google.clientEmail!,
      client_id: config.google.clientId!,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${config.google.clientEmail}`,
    };

    return new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: this.SCOPES,
    });
  }

  public async getSpreadsheetInfo(spreadsheetId: string): Promise<{
    title: string;
    sheets: Array<{
      name: string;
      id: number;
      rowCount: number;
      columnCount: number;
    }>;
  }> {
    const sheets = await this.initializeAuth();

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    if (!response.data.sheets) {
      throw new Error("No sheets found in spreadsheet");
    }

    const sheetInfo = response.data.sheets.map((sheet) => ({
      name: sheet.properties?.title || "Unknown",
      id: sheet.properties?.sheetId || 0,
      rowCount: sheet.properties?.gridProperties?.rowCount || 0,
      columnCount: sheet.properties?.gridProperties?.columnCount || 0,
    }));

    return {
      title: response.data.properties?.title || "Unknown Spreadsheet",
      sheets: sheetInfo,
    };
  }

  public async getSheetData(
    spreadsheetId: string,
    range: string,
    options: {
      valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA";
      dateTimeRenderOption?: "FORMATTED_STRING" | "SERIAL_NUMBER";
    } = {}
  ): Promise<string[][]> {
    const sheets = await this.initializeAuth();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: options.valueRenderOption || "FORMATTED_VALUE",
      dateTimeRenderOption: options.dateTimeRenderOption || "FORMATTED_STRING",
    });

    return response.data.values || [];
  }

  public async getAllSheetData(
    spreadsheetId: string,
    sheetName: string = "Sheet1"
  ): Promise<{
    sheetName: string;
    totalRows: number;
    totalColumns: number;
    data: string[][];
    headers: string[];
    objects: Array<Record<string, string>>;
  }> {
    const sheets = await this.initializeAuth();

    // First, try to get all data without specifying exact dimensions
    // This approach gets only the data that actually exists
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName, // Just the sheet name, let Google determine the range
      valueRenderOption: "FORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });

    const data = response.data.values || [];

    // If no data found with sheet name only, try a broader range
    if (data.length === 0) {
      const broadResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:Z`, // Get columns A to Z with all their data
        valueRenderOption: "FORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });

      const broadData = broadResponse.data.values || [];

      // Get sheet metadata for total dimensions
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const targetSheet = spreadsheetInfo.data.sheets?.find(
        (sheet: any) => sheet.properties?.title === sheetName
      );

      const totalRows =
        targetSheet?.properties?.gridProperties?.rowCount || broadData.length;
      const totalColumns =
        targetSheet?.properties?.gridProperties?.columnCount || 26;

      const headers = broadData.length > 0 ? broadData[0] : [];
      const objects = this.convertToObjects(broadData);

      return {
        sheetName,
        totalRows,
        totalColumns,
        data: broadData,
        headers,
        objects,
      };
    }

    // If we got data with just sheet name, get the metadata too
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const targetSheet = spreadsheetInfo.data.sheets?.find(
      (sheet: any) => sheet.properties?.title === sheetName
    );

    const totalRows =
      targetSheet?.properties?.gridProperties?.rowCount || data.length;
    const totalColumns =
      targetSheet?.properties?.gridProperties?.columnCount ||
      data[0]?.length ||
      0;

    const headers = data.length > 0 ? data[0] : [];
    const objects = this.convertToObjects(data);

    return {
      sheetName,
      totalRows,
      totalColumns,
      data,
      headers,
      objects,
    };
  }

  // Helper method to convert column number to letter (1 -> A, 26 -> Z, 27 -> AA)
  private columnToLetter(columnNumber: number): string {
    let result = "";
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode(65 + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }

  public convertToObjects(rows: string[][]): Array<Record<string, string>> {
    if (rows.length === 0) return [];

    const headers = rows[0];
    return rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });
  }
}
