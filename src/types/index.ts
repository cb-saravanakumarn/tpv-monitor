export interface GoogleServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export interface SheetInfo {
  name: string;
  id: number;
  rowCount: number;
  columnCount: number;
}

export interface SheetResponse {
  success: boolean;
  spreadsheetTitle?: string;
  sheets?: SheetInfo[];
  error?: string;
  details?: string;
}

export interface DataResponse {
  success: boolean;
  range?: string;
  rowCount?: number;
  data?: {
    headers?: string[];
    rows?: string[][];
    objects?: Record<string, string>[];
    raw?: string[][];
  };
  error?: string;
  details?: string;
}

export interface QueryParams {
  sheet?: string;
  startRow?: string;
  endRow?: string;
  startCol?: string;
  endCol?: string;
  format?: "raw" | "objects" | "both";
  valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA";
  dateTimeRenderOption?: "FORMATTED_STRING" | "SERIAL_NUMBER";
}

export interface SlackTableData {
  headers: string[];
  rows: string[][];
  metadata: {
    spreadsheetId: string;
    sheetName: string;
    totalRows: number;
    actualDataRows: number;
  };
}

export interface SlackNotificationOptions {
  channel?: string;
  threadTs?: string;
  includeMetadata?: boolean;
  maxRows?: number;
}
