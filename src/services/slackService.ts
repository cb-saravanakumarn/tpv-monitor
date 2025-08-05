// src/services/slackService.ts
import { WebClient } from "@slack/web-api";
import { config } from "../config/environment";
import { SlackTableData, SlackNotificationOptions } from "../types";

export class SlackService {
  private static instance: SlackService;
  private client: WebClient | null = null;

  private constructor() {
    if (config.slack.botToken) {
      this.client = new WebClient(config.slack.botToken);
    }
  }

  public static getInstance(): SlackService {
    if (!SlackService.instance) {
      SlackService.instance = new SlackService();
    }
    return SlackService.instance;
  }

  public isEnabled(): boolean {
    return config.slack.enableNotifications && !!this.client;
  }

  /**
   * Format spreadsheet data as a Slack table using blocks
   */
  private formatTableAsBlocks(
    data: SlackTableData,
    options: SlackNotificationOptions = {}
  ) {
    const { headers, rows, metadata } = data;
    const { includeMetadata = true, maxRows = 50 } = options;

    const blocks: any[] = [];

    // Header section
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 Google Sheets Data: ${metadata.sheetName}`,
      },
    });

    // Metadata section
    if (includeMetadata) {
      blocks.push({
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Spreadsheet ID:*\n${metadata.spreadsheetId}`,
          },
          {
            type: "mrkdwn",
            text: `*Sheet Name:*\n${metadata.sheetName}`,
          },
          {
            type: "mrkdwn",
            text: `*Total Rows:*\n${metadata.totalRows}`,
          },
          {
            type: "mrkdwn",
            text: `*Data Rows:*\n${metadata.actualDataRows}`,
          },
        ],
      });

      blocks.push({
        type: "divider",
      });
    }

    // Table data
    if (headers.length > 0 && rows.length > 0) {
      // Limit rows if specified
      const displayRows = rows.slice(0, maxRows);
      const hasMoreRows = rows.length > maxRows;

      // Create table header
      const headerText = headers.map((header) => `*${header}*`).join(" | ");
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: headerText,
        },
      });

      // Add separator
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: headers.map(() => "---").join(" | "),
        },
      });

      // Add data rows
      displayRows.forEach((row, index) => {
        // Ensure row has same length as headers
        const paddedRow = [...row];
        while (paddedRow.length < headers.length) {
          paddedRow.push("");
        }

        const rowText = paddedRow
          .slice(0, headers.length)
          .map((cell) => cell?.toString() || "-")
          .join(" | ");

        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: rowText,
          },
        });
      });

      // Add "more rows" indicator if needed
      if (hasMoreRows) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `_... and ${rows.length - maxRows} more rows_`,
          },
        });
      }
    } else {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "ℹ️ No data found in the spreadsheet",
        },
      });
    }

    // Timestamp
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📅 Retrieved at: ${new Date().toISOString()}`,
        },
      ],
    });

    return blocks;
  }

  /**
   * Send spreadsheet data to Slack channel
   */
  public async sendSpreadsheetNotification(
    data: SlackTableData,
    options: SlackNotificationOptions = {}
  ): Promise<boolean> {
    if (!this.isEnabled()) {
      console.log("Slack notifications are disabled or not configured");
      return false;
    }

    try {
      const channel = options.channel || config.slack.channel;
      const blocks = this.formatTableAsBlocks(data, options);

      const result = await this.client!.chat.postMessage({
        channel,
        blocks,
        thread_ts: options.threadTs,
        unfurl_links: false,
        unfurl_media: false,
      });

      if (result.ok) {
        console.log(`✅ Slack notification sent successfully to ${channel}`);
        return true;
      } else {
        console.error("❌ Failed to send Slack notification:", result.error);
        return false;
      }
    } catch (error) {
      console.error("❌ Error sending Slack notification:", error);
      return false;
    }
  }

  /**
   * Send a simple text message to Slack
   */
  public async sendMessage(
    text: string,
    options: SlackNotificationOptions = {}
  ): Promise<boolean> {
    if (!this.isEnabled()) {
      console.log("Slack notifications are disabled or not configured");
      return false;
    }

    try {
      const channel = options.channel || config.slack.channel;

      const result = await this.client!.chat.postMessage({
        channel,
        text,
        thread_ts: options.threadTs,
      });

      if (result.ok) {
        console.log(`✅ Slack message sent successfully to ${channel}`);
        return true;
      } else {
        console.error("❌ Failed to send Slack message:", result.error);
        return false;
      }
    } catch (error) {
      console.error("❌ Error sending Slack message:", error);
      return false;
    }
  }

  /**
   * Test Slack connection
   */
  public async testConnection(): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const result = await this.client!.auth.test();
      return result.ok === true;
    } catch (error) {
      console.error("❌ Slack connection test failed:", error);
      return false;
    }
  }
}
