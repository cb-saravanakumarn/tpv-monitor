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
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    channel: process.env.SLACK_CHANNEL || "#general",
    enableNotifications: process.env.SLACK_ENABLE_NOTIFICATIONS === "true",
  },
};

// Validate required environment variables
export const validateEnvironment = (): void => {
  const { google, slack } = config;

  if (
    !google.serviceAccountKeyFile &&
    (!google.projectId || !google.privateKey || !google.clientEmail)
  ) {
    throw new Error(
      "Missing Google credentials. Provide either GOOGLE_SERVICE_ACCOUNT_KEY_FILE or " +
        "GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY, and GOOGLE_CLIENT_EMAIL"
    );
  }

  if (slack.enableNotifications && !slack.botToken) {
    throw new Error(
      "Slack notifications are enabled but SLACK_BOT_TOKEN is missing"
    );
  }
};
