import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ExpertBackendClient } from '../expert-backend-client.js';
import { READ_ONLY_TOOL_ANNOTATIONS } from './policy.js';

export function registerExpertTools(
  server: McpServer,
  getClient: () => ExpertBackendClient,
) {
  server.tool(
    'list_companies',
    'Lists the EXPERT companies the authenticated user is authorized to access. Read-only. Use this before company-scoped tools when the company is not explicit.',
    {},
    { ...READ_ONLY_TOOL_ANNOTATIONS, title: 'List authorized EXPERT companies' },
    async () => {
      const companies = await getClient().listCompanies();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            companies,
            count: companies.length,
          }, null, 2),
        }],
      };
    },
  );
}
