#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { LinearClient } from '@linear/sdk';
// Get Linear API key from environment variables
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
if (!LINEAR_API_KEY) {
    throw new Error('LINEAR_API_KEY environment variable is required');
}
// Create Linear client
const linearClient = new LinearClient({ apiKey: LINEAR_API_KEY });
class LinearServer {
    server;
    constructor() {
        this.server = new Server({
            name: 'linear-server',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        // Error handling
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'get_tasks',
                    description: 'Get tasks from Linear with optional filtering',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            status: {
                                type: 'string',
                                description: 'Filter by status (e.g., "Todo", "In Progress", "Done")',
                            },
                            assignee: {
                                type: 'string',
                                description: 'Filter by assignee name or ID',
                            },
                            team: {
                                type: 'string',
                                description: 'Filter by team name or ID',
                            },
                            limit: {
                                type: 'number',
                                description: 'Maximum number of tasks to return (default: 20)',
                                minimum: 1,
                                maximum: 100,
                            },
                        },
                    },
                },
                {
                    name: 'get_task_details',
                    description: 'Get detailed information about a specific task',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            taskId: {
                                type: 'string',
                                description: 'The ID of the task to retrieve details for',
                            },
                        },
                        required: ['taskId'],
                    },
                },
                {
                    name: 'get_teams',
                    description: 'Get a list of teams in the Linear workspace',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
                {
                    name: 'get_users',
                    description: 'Get a list of users in the Linear workspace',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                switch (request.params.name) {
                    case 'get_tasks':
                        return await this.handleGetTasks(request.params.arguments);
                    case 'get_task_details':
                        return await this.handleGetTaskDetails(request.params.arguments);
                    case 'get_teams':
                        return await this.handleGetTeams();
                    case 'get_users':
                        return await this.handleGetUsers();
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            }
            catch (error) {
                console.error('Error handling tool call:', error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    async handleGetTasks(args) {
        const limit = args?.limit || 20;
        // Build the filter
        let filter = {};
        if (args?.status) {
            // Get workflow states to map status name to ID
            const workflowStates = await linearClient.workflowStates();
            const state = workflowStates.nodes.find((s) => s.name.toLowerCase() === args.status.toLowerCase());
            if (state) {
                filter.stateId = { eq: state.id };
            }
        }
        if (args?.assignee) {
            const users = await linearClient.users();
            const user = users.nodes.find((u) => u.name.toLowerCase().includes(args.assignee.toLowerCase()) ||
                u.id === args.assignee);
            if (user) {
                filter.assigneeId = { eq: user.id };
            }
        }
        if (args?.team) {
            const teams = await linearClient.teams();
            const team = teams.nodes.find((t) => t.name.toLowerCase().includes(args.team.toLowerCase()) ||
                t.id === args.team);
            if (team) {
                filter.teamId = { eq: team.id };
            }
        }
        // Fetch issues with the filter
        const issues = await linearClient.issues({
            filter,
            first: limit,
        });
        // Format the response
        const formattedIssues = await Promise.all(issues.nodes.map(async (issue) => {
            const assignee = issue.assignee ? await issue.assignee : null;
            const team = issue.team ? await issue.team : null;
            const state = issue.state ? await issue.state : null;
            return {
                id: issue.id,
                title: issue.title,
                description: issue.description,
                status: state ? state.name : null,
                assignee: assignee ? assignee.name : null,
                team: team ? team.name : null,
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt,
                url: issue.url,
            };
        }));
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(formattedIssues, null, 2),
                },
            ],
        };
    }
    async handleGetTaskDetails(args) {
        if (!args?.taskId) {
            throw new McpError(ErrorCode.InvalidParams, 'taskId is required');
        }
        const issue = await linearClient.issue(args.taskId);
        if (!issue) {
            throw new McpError(ErrorCode.InvalidRequest, `Task with ID ${args.taskId} not found`);
        }
        const assignee = issue.assignee ? await issue.assignee : null;
        const team = issue.team ? await issue.team : null;
        const state = issue.state ? await issue.state : null;
        const comments = await issue.comments();
        const attachments = await issue.attachments();
        const labels = await issue.labels();
        const formattedIssue = {
            id: issue.id,
            title: issue.title,
            description: issue.description,
            status: state ? state.name : null,
            assignee: assignee ? {
                id: assignee.id,
                name: assignee.name,
                email: assignee.email,
            } : null,
            team: team ? {
                id: team.id,
                name: team.name,
            } : null,
            priority: issue.priority,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            dueDate: issue.dueDate,
            estimate: issue.estimate,
            url: issue.url,
            comments: comments.nodes.map(comment => ({
                id: comment.id,
                body: comment.body,
                createdAt: comment.createdAt,
                userId: comment.userId,
            })),
            attachments: attachments.nodes.map(attachment => ({
                id: attachment.id,
                title: attachment.title,
                url: attachment.url,
            })),
            labels: labels.nodes.map(label => ({
                id: label.id,
                name: label.name,
                color: label.color,
            })),
        };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(formattedIssue, null, 2),
                },
            ],
        };
    }
    async handleGetTeams() {
        const teams = await linearClient.teams();
        const formattedTeams = teams.nodes.map(team => ({
            id: team.id,
            name: team.name,
            key: team.key,
            description: team.description,
        }));
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(formattedTeams, null, 2),
                },
            ],
        };
    }
    async handleGetUsers() {
        const users = await linearClient.users();
        const formattedUsers = users.nodes.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            displayName: user.displayName,
            active: user.active,
        }));
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(formattedUsers, null, 2),
                },
            ],
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Linear MCP server running on stdio');
    }
}
const server = new LinearServer();
server.run().catch(console.error);
