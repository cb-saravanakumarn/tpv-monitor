// src/services/googleOAuthService.ts
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";
import { config } from "../config/environment";

export class GoogleOAuthService {
  private static instance: GoogleOAuthService;
  private readonly SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
  ];

  private constructor() {}

  public static getInstance(): GoogleOAuthService {
    if (!GoogleOAuthService.instance) {
      GoogleOAuthService.instance = new GoogleOAuthService();
    }
    return GoogleOAuthService.instance;
  }

  public getOAuthClient(): OAuth2Client {
    if (
      !config.google.oauthClientId ||
      !config.google.oauthClientSecret ||
      !config.google.oauthRedirectUri
    ) {
      throw new Error(
        "OAuth client is not configured. Set GOOGLE_OAUTH_CLIENT_ID/GOOGLE_OAUTH_CLIENT_SECRET/GOOGLE_OAUTH_REDIRECT_URI."
      );
    }

    return new google.auth.OAuth2(
      config.google.oauthClientId,
      config.google.oauthClientSecret,
      config.google.oauthRedirectUri
    );
  }

  public generateAuthUrl(): string {
    const oAuth2Client = this.getOAuthClient();
    const url = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: this.SCOPES,
      prompt: "consent",
    });
    return url;
  }

  public async handleOAuthCallback(code: string): Promise<void> {
    const oAuth2Client = this.getOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    this.persistTokens(tokens);
  }

  public isAuthorized(): boolean {
    try {
      if (!config.google.oauthTokenFile) return false;
      return fs.existsSync(config.google.oauthTokenFile);
    } catch {
      return false;
    }
  }

  public loadTokensIfAvailable(oAuth2Client: OAuth2Client): void {
    if (
      config.google.oauthTokenFile &&
      fs.existsSync(config.google.oauthTokenFile)
    ) {
      try {
        const tokenContent = fs.readFileSync(
          config.google.oauthTokenFile,
          "utf8"
        );
        const tokens = JSON.parse(tokenContent);
        oAuth2Client.setCredentials(tokens);
      } catch {
        // ignore
      }
    }
  }

  public async revoke(): Promise<void> {
    const client = this.getOAuthClient();
    this.loadTokensIfAvailable(client);
    try {
      await client.revokeCredentials();
    } catch {
      // ignore revoke errors
    }
    if (
      config.google.oauthTokenFile &&
      fs.existsSync(config.google.oauthTokenFile)
    ) {
      try {
        fs.unlinkSync(config.google.oauthTokenFile);
      } catch {
        // ignore
      }
    }
  }

  private persistTokens(tokens: any): void {
    if (!config.google.oauthTokenFile) return;
    const dir = path.dirname(config.google.oauthTokenFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      config.google.oauthTokenFile,
      JSON.stringify(tokens, null, 2),
      "utf8"
    );
  }
}
