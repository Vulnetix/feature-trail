<img src="src/assets/logo.png" alt="FeatureTrail Logo" width="200" />

**FeatureTrail** is a Google Sheets powered roadmap site, hosted on CloudFlare Pages.

This application allows non-technical people to keep a product roadmap updated in a Google spreadsheet, while providing technical configuration options to adapt to spreadsheet changes without requiring code modifications.

## ✨ Features

- 🔄 **Feature Status**: Using a simple lifecycle; Needs Feedback (default backlog), In Progress, and Complete
- 👍 **Voting**: Customers can upvote their favorite features, allowing product owners to prioritize based on demand. Voting is disabled once a feature is in progress or completed.
- 💬 **Comments**: Timeline of comments for voters, to assist product owners in understanding why a feature is of interest to customers
- 🆕 **Feature Request**: Directions for customers to request new features for inclusion in the roadmap
- 🔍 **Tracking**: Customers who request features are provided an ID so they can track feature status
- 🔎 **Search**: Simple search using ID (exact), or any part of the feature name or description
- **Theming**: Default dark theme, light mode switcher. Powered by Vuefity theming engine.

## 🚀 Install

1. 🍴 Fork this repository
2. 🔗 Connect CloudFlare Pages to your forked repository
3. ⚙️ Add the following environment variables in your CloudFlare Pages project settings:
   
   #### Backend Environment Variables (CloudFlare Functions)
   - `SPREADSHEET_ID`: The ID of your Google Sheets document (found in the URL between /d/ and /edit)
   - `SPREADSHEET_FEATURES_RANGE`: The sheet name or range where features are stored (e.g., "Features" or "Features!A1:Z1000")
   - `SPREADSHEET_FEATURES_MAPPING`: A JSON object that maps spreadsheet columns to feature properties (see format below)

   #### Frontend Environment Variables (Vite)
   - `VITE_SITE_TITLE`: The title of your roadmap site (default: "FeatureTrail")
   - `VITE_SUPPORT_EMAIL`: The email address for support inquiries
   - `VITE_SUPPORT_OTHER_NAME`: The name of an alternative support channel (e.g., "Discord", "Slack") 
   - `VITE_SUPPORT_OTHER_URL`: The URL for the alternative support channel

4. 🗄️ Create a KV store binding named `KV_STORE` for storing votes. [Learn more about KV bindings to CloudFlare Pages here](https://developers.cloudflare.com/pages/platform/functions/bindings/#kv-namespace-bindings)

### 🔄 `SPREADSHEET_FEATURES_MAPPING` Format

This mapping must be a valid JSON string with the following required keys:
```json
{
  "uuid": "ID Column",
  "title": "Feature Title Column",
  "description": "Description Column",
  "timestamp": "Date Added Column",
  "isComplete": "Completed Column",
  "needsFeedback": "Needs Feedback Column",
  "inProgress": "In Progress Column",
  "targetRelease": "Target Release Column"
}
```

Replace the right-side values with the exact column headers from your spreadsheet. The boolean properties (`isComplete`, `needsFeedback`, `inProgress`) should map to columns containing "true"/"false" values.

## 💻 Development

1. Clone this repo
2. Create the following configuration files:

   #### For Backend (CloudFlare Functions)
   Create a `.dev.vars` file in the root directory:
   ```
   SPREADSHEET_ID=your_spreadsheet_id_here
   SPREADSHEET_FEATURES_RANGE=your_sheet_name_or_range_here
   SPREADSHEET_FEATURES_MAPPING={"uuid":"ID","title":"Feature","description":"Description","timestamp":"Date","isComplete":"Complete","needsFeedback":"Needs Feedback","inProgress":"In Progress","targetRelease":"Release"}
   ```

   #### For Frontend (Vite)
   Create an `.env` file in the root directory:
   ```properties
   VITE_SITE_TITLE=FeatureTrail
   VITE_SUPPORT_EMAIL="support@example.com"
   VITE_SUPPORT_OTHER_NAME="Discord"
   VITE_SUPPORT_OTHER_URL="https://discord.gg/your-discord-invite"
   ```

3. Run `yarn install` to install dependencies
4. Start the development server with `yarn dev` or preview with `yarn run preview`
5. 🌐 Visit the URL provided in the command output

## 📚 Environment Variables

### Vite Environment Variables

The application uses Vite environment variables for frontend configuration. These variables are prefixed with `VITE_` and can be accessed in the application code.

Create an `.env` file in the root directory with the following variables:

```properties
VITE_SITE_TITLE=FeatureTrail
VITE_SUPPORT_EMAIL="support@example.com"
VITE_SUPPORT_OTHER_NAME="Discord"
VITE_SUPPORT_OTHER_URL="https://discord.gg/your-discord-invite"
```

- `VITE_SITE_TITLE`: The title of the site that appears in the browser tab and header
- `VITE_SUPPORT_EMAIL`: The email address for support inquiries
- `VITE_SUPPORT_OTHER_NAME`: The name of an alternative support channel (e.g., "Discord", "Slack")
- `VITE_SUPPORT_OTHER_URL`: The URL for the alternative support channel

#### Overriding for CloudFlare Builds

To override these variables for CloudFlare builds:

1. Go to your CloudFlare Pages project settings
2. Navigate to the "Environment variables" tab
3. Add each variable with its value
4. Set the environment to "Production" or "Preview" as needed

For more information about Vite environment variables, see the [Vite documentation](https://vitejs.dev/guide/env-and-mode.html).

## ⚠️ Troubleshooting

If you encounter issues related to the spreadsheet integration:

1. Ensure your spreadsheet is publicly accessible or properly shared
2. Check that the column headers in your spreadsheet exactly match the values in the `SPREADSHEET_FEATURES_MAPPING`
3. Verify that all required columns exist in your spreadsheet and contain valid data
4. For boolean fields, ensure they contain "true" or "false" values (case insensitive)

## 🛠️ Technology Stack

- 🟢 Vue 3 with TypeScript
- 💎 Vuetify for UI components
- 🏪 Pinia for state management
- ☁️ CloudFlare Pages for hosting and serverless functions
- 📊 Google Sheets as the backend database
