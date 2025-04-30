#!/usr/bin/env node

/**
 * This script provides instructions for obtaining a Linear API key
 * and updating the MCP settings file.
 */

console.log(`
=================================================
  How to Get Your Linear API Key
=================================================

1. Log in to your Linear account at https://linear.app

2. Go to Settings > API > Personal API Keys
   (Direct link: https://linear.app/settings/api)

3. Click "Create Key" and give it a name (e.g., "MCP Server")

4. Copy the generated API key (it starts with "lin_api_")

5. Update the MCP settings file with your API key:
   - Location: /Users/tiru5/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json
   - Replace "YOUR_LINEAR_API_KEY_HERE" with your actual API key

6. Restart Cursor or Claude to apply the changes

=================================================
`);