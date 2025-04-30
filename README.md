# Linear MCP Server

This MCP server provides tools to interact with the Linear API, allowing you to fetch tasks and their associated details.

<a href="https://glama.ai/mcp/servers/@Tyru5/linear-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Tyru5/linear-mcp/badge" alt="Linear Server MCP server" />
</a>

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Build the server:
   ```
   npm run build
   ```

3. Configure your Linear API key:
   - Get your API key from Linear (Settings > API > Personal API Keys)
   - Update the MCP settings file with your API key:
     - Location: `/Users/tiru5/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json`
     - Replace `YOUR_LINEAR_API_KEY_HERE` with your actual API key

## Available Tools

### get_tasks

Get tasks from Linear with optional filtering.

**Parameters:**
- `status` (optional): Filter by status (e.g., "Todo", "In Progress", "Done")
- `assignee` (optional): Filter by assignee name or ID
- `team` (optional): Filter by team name or ID
- `limit` (optional): Maximum number of tasks to return (default: 20, max: 100)

**Example:**
```json
{
  "status": "In Progress",
  "assignee": "John",
  "team": "Engineering",
  "limit": 10
}
```

### get_task_details

Get detailed information about a specific task.

**Parameters:**
- `taskId` (required): The ID of the task to retrieve details for

**Example:**
```json
{
  "taskId": "LIN-123"
}
```

### get_teams

Get a list of teams in the Linear workspace.

**Parameters:** None

### get_users

Get a list of users in the Linear workspace.

**Parameters:** None

## Usage Examples

### Fetching tasks assigned to a specific user

```
use_mcp_tool
server_name: linear
tool_name: get_tasks
arguments: {
  "assignee": "John",
  "status": "In Progress"
}
```

### Getting details for a specific task

```
use_mcp_tool
server_name: linear
tool_name: get_task_details
arguments: {
  "taskId": "LIN-123"
}
```

### Listing all teams

```
use_mcp_tool
server_name: linear
tool_name: get_teams
arguments: {}
```

### Listing all users

```
use_mcp_tool
server_name: linear
tool_name: get_users
arguments: {}
```