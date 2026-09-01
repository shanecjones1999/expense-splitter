import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import type { GatewayClient } from './gateway-client.js';

const splitInputSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().min(0).optional(),
  percentage: z.number().min(0).optional(),
});

function jsonResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function registerTools(server: McpServer, client: GatewayClient): void {
  server.registerTool(
    'get_me',
    {
      description:
        'Get the currently authenticated user (id, email, displayName). Use this to determine paidByUserId defaults.',
      inputSchema: z.object({}),
    },
    async () => {
      const me = await client.request('GET', '/auth/me');
      return jsonResult(me);
    },
  );

  server.registerTool(
    'list_groups',
    {
      description: 'List all groups the authenticated user belongs to.',
      inputSchema: z.object({}),
    },
    async () => jsonResult(await client.request('GET', '/groups')),
  );

  server.registerTool(
    'get_group',
    {
      description: 'Get a group by ID, including its members.',
      inputSchema: z.object({
        groupId: z.string().uuid(),
      }),
    },
    async ({ groupId }) =>
      jsonResult(await client.request('GET', `/groups/${groupId}`)),
  );

  server.registerTool(
    'create_group',
    {
      description: 'Create a new expense group.',
      inputSchema: z.object({
        name: z.string().min(1),
        currency: z.enum(['USD']).optional(),
      }),
    },
    async ({ name, currency }) =>
      jsonResult(await client.request('POST', '/groups', { name, currency })),
  );

  server.registerTool(
    'add_group_member',
    {
      description:
        'Add a member to a group by email or userId. Provide exactly one of email or userId.',
      inputSchema: z.object({
        groupId: z.string().uuid(),
        email: z.string().email().optional(),
        userId: z.string().uuid().optional(),
      }),
    },
    async ({ groupId, email, userId }) => {
      if (!email && !userId) {
        throw new Error('Provide either email or userId');
      }
      if (email && userId) {
        throw new Error('Provide only one of email or userId');
      }
      return jsonResult(
        await client.request('POST', `/groups/${groupId}/members`, {
          email,
          userId,
        }),
      );
    },
  );

  server.registerTool(
    'list_expenses',
    {
      description: 'List all expenses in a group.',
      inputSchema: z.object({
        groupId: z.string().uuid(),
      }),
    },
    async ({ groupId }) =>
      jsonResult(
        await client.request('GET', `/groups/${groupId}/expenses`),
      ),
  );

  server.registerTool(
    'create_expense',
    {
      description:
        'Add an expense to a group. Amounts are in dollars. For equal splits, provide one split entry per participant with only userId. For exact splits, include amount per member. For percentage splits, include percentage per member (must sum to 100).',
      inputSchema: z.object({
        groupId: z.string().uuid(),
        description: z.string().min(1),
        amount: z.number().min(0.01),
        paidByUserId: z.string().uuid(),
        splitType: z.enum(['equal', 'exact', 'percentage']),
        splits: z.array(splitInputSchema).min(1),
        expenseDate: z
          .string()
          .describe('ISO 8601 date, e.g. 2026-09-01'),
      }),
    },
    async (body) => {
      const { groupId, ...payload } = body;
      return jsonResult(
        await client.request('POST', `/groups/${groupId}/expenses`, payload),
      );
    },
  );

  server.registerTool(
    'get_balances',
    {
      description:
        'Get net balances for all members in a group. Positive means owed to the member; negative means they owe.',
      inputSchema: z.object({
        groupId: z.string().uuid(),
      }),
    },
    async ({ groupId }) =>
      jsonResult(
        await client.request('GET', `/groups/${groupId}/balances`),
      ),
  );

  server.registerTool(
    'list_settlements',
    {
      description: 'List settlement payments recorded in a group.',
      inputSchema: z.object({
        groupId: z.string().uuid(),
      }),
    },
    async ({ groupId }) =>
      jsonResult(
        await client.request('GET', `/groups/${groupId}/settlements`),
      ),
  );

  server.registerTool(
    'create_settlement',
    {
      description:
        'Record a settlement payment from the authenticated user to another group member.',
      inputSchema: z.object({
        groupId: z.string().uuid(),
        toUserId: z.string().uuid(),
        amount: z.number().min(0.01),
        note: z.string().optional(),
      }),
    },
    async ({ groupId, toUserId, amount, note }) =>
      jsonResult(
        await client.request('POST', `/groups/${groupId}/settlements`, {
          toUserId,
          amount,
          note,
        }),
      ),
  );
}
