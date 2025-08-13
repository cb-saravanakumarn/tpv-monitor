// src/config/environment.ts
import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  google: {
    projectId: process.env.GOOGLE_PROJECT_ID,
    privateKeyId: process.env.GOOGLE_PRIVATE_KEY_ID,
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    clientId: process.env.GOOGLE_CLIENT_ID,
    serviceAccountKeyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
    // OAuth 2.0 Web/Installed App credentials
    oauthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    oauthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    oauthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
    oauthTokenFile:
      process.env.GOOGLE_OAUTH_TOKEN_FILE ||
      `${process.cwd()}/google-oauth-tokens.json`,
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    channel: process.env.SLACK_CHANNEL || "",
    enableNotifications: process.env.SLACK_ENABLE_NOTIFICATIONS === "true",
  },
};

// Validate required environment variables
export const validateEnvironment = (): void => {
  const { google, slack } = config;

  const hasServiceAccount =
    !!google.serviceAccountKeyFile ||
    (!!google.projectId && !!google.privateKey && !!google.clientEmail);

  const hasOAuth =
    !!google.oauthClientId &&
    !!google.oauthClientSecret &&
    !!google.oauthRedirectUri;

  if (!hasServiceAccount && !hasOAuth) {
    throw new Error(
      "Missing Google credentials. Provide either service account (GOOGLE_SERVICE_ACCOUNT_KEY_FILE or GOOGLE_PROJECT_ID/GOOGLE_PRIVATE_KEY/GOOGLE_CLIENT_EMAIL) or OAuth (GOOGLE_OAUTH_CLIENT_ID/GOOGLE_OAUTH_CLIENT_SECRET/GOOGLE_OAUTH_REDIRECT_URI)."
    );
  }

  if (slack.enableNotifications && !slack.botToken) {
    throw new Error(
      "Slack notifications are enabled but SLACK_BOT_TOKEN is missing"
    );
  }
};
