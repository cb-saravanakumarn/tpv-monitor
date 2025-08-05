# Slack Integration Setup Guide

This guide will help you set up Slack notifications for your TPV Monitor application.

## Overview

The TPV Monitor now includes Slack integration that automatically sends spreadsheet data to a Slack channel whenever the `/sheets/:spreadsheetId/all` endpoint is called. The data is formatted as a nice table with metadata.

## Features

- 📊 Automatically sends Google Sheets data to Slack as formatted tables
- 🔧 Configurable channel and message options
- 📈 Includes metadata (spreadsheet ID, sheet name, row counts)
- 🚀 Non-blocking operation (doesn't affect API response times)
- ✅ Health check endpoint for Slack connectivity
- 🛡️ Error handling with graceful fallbacks

## Slack App Setup

### 1. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Enter your app name (e.g., "TPV Monitor")
5. Select your workspace

### 2. Configure Bot Permissions

1. In your app dashboard, go to "OAuth & Permissions"
2. Scroll down to "Bot Token Scopes"
3. Add the following scopes:
   - `chat:write` - Send messages as the bot
   - `chat:write.public` - Send messages to channels the bot isn't in

### 3. Install the App

1. In "OAuth & Permissions", click "Install to Workspace"
2. Authorize the app
3. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 4. Add Bot to Channel (Optional)

If you want to send to a private channel, invite the bot:

```
/invite @YourBotName
```

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Slack Settings

Edit your `.env` file:

```env
# Enable Slack notifications
SLACK_ENABLE_NOTIFICATIONS=true

# Your Slack Bot Token (from step 3 above)
SLACK_BOT_TOKEN=xoxb-your-bot-token-here

# Target channel (can be #channel-name or channel ID)
SLACK_CHANNEL=#general
```

### 3. Environment Variables

| Variable                     | Required | Description                        | Example                     |
| ---------------------------- | -------- | ---------------------------------- | --------------------------- |
| `SLACK_ENABLE_NOTIFICATIONS` | No       | Enable/disable Slack notifications | `true` or `false`           |
| `SLACK_BOT_TOKEN`            | Yes\*    | Slack Bot User OAuth Token         | `xoxb-1234-5678-abcd`       |
| `SLACK_CHANNEL`              | No       | Default channel for notifications  | `#general` or `C1234567890` |

\*Required only if `SLACK_ENABLE_NOTIFICATIONS=true`

## API Endpoints

### Health Check with Slack Status

```http
GET /
```

Returns general health info including Slack status:

```json
{
  "message": "Google Sheets Express TypeScript API is running!",
  "endpoints": { ... },
  "slack": {
    "enabled": true
  }
}
```

### Slack Connectivity Test

```http
GET /slack/health
```

Tests Slack connection:

```json
{
  "success": true,
  "message": "Slack connection is working properly",
  "enabled": true,
  "connected": true
}
```

### Get All Sheet Data (with Slack Notification)

```http
GET /sheets/:spreadsheetId/all?sheet=Sheet1&includeEmpty=false
```

This endpoint now:

1. Returns the Google Sheets data as before
2. **Automatically sends the data to Slack** (if enabled)

## Slack Message Format

The Slack notification includes:

### Header

📊 Google Sheets Data: {SheetName}

### Metadata Section

- **Spreadsheet ID:** `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
- **Sheet Name:** `Sheet1`
- **Total Rows:** `1000`
- **Data Rows:** `150`

### Table Data

```
*Column1* | *Column2* | *Column3*
--- | --- | ---
Value1 | Value2 | Value3
Value4 | Value5 | Value6
... and 25 more rows
```

### Footer

📅 Retrieved at: 2024-01-15T10:30:00.000Z

## Configuration Options

You can customize notifications by modifying the `sendSlackNotification` method in `src/controllers/sheetsController.ts`:

```typescript
await this.slackService.sendSpreadsheetNotification(slackData, {
  includeMetadata: true, // Show metadata section
  maxRows: 25, // Limit table rows (default: 50)
  channel: "#custom-channel", // Override default channel
});
```

## Troubleshooting

### Slack notifications not working

1. **Check health endpoint:** `GET /slack/health`
2. **Verify environment variables:**
   ```bash
   echo $SLACK_ENABLE_NOTIFICATIONS
   echo $SLACK_BOT_TOKEN
   echo $SLACK_CHANNEL
   ```
3. **Check bot permissions:** Ensure bot has `chat:write` scope
4. **Check channel access:** Bot must be in private channels

### Bot not in channel error

If you get a "channel_not_found" error:

- For public channels: No action needed
- For private channels: Invite the bot with `/invite @YourBotName`

### Token errors

- Ensure token starts with `xoxb-`
- Regenerate token if needed in Slack app settings
- Check token hasn't expired

## Disabling Slack Notifications

To disable Slack notifications without removing the code:

```env
SLACK_ENABLE_NOTIFICATIONS=false
```

Or remove/comment out the `SLACK_BOT_TOKEN`:

```env
# SLACK_BOT_TOKEN=xoxb-your-token
```

## Development vs Production

### Development

- Use a test Slack workspace
- Send to a development channel like `#dev-notifications`

### Production

- Use your production Slack workspace
- Configure appropriate channels
- Monitor rate limits for high-volume usage

## Rate Limits

Slack has rate limits for API calls:

- Tier 1 methods (like chat.postMessage): 1+ per second
- The app automatically handles rate limiting

For high-volume usage, consider:

- Batching notifications
- Using different channels
- Implementing queuing system

## Security Notes

- Keep your `SLACK_BOT_TOKEN` secure
- Don't commit tokens to version control
- Use environment variables in production
- Regularly rotate tokens if needed
- Monitor bot activity in Slack audit logs
