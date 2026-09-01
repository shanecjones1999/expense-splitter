import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { loadConfig } from './config.js';
import { GatewayClient } from './gateway-client.js';
import { registerTools } from './register-tools.js';

function createServer(): McpServer {
  const config = loadConfig();
  const client = new GatewayClient(config);

  const server = new McpServer({
    name: 'expense-splitter',
    version: '0.1.0',
  });

  registerTools(server, client);
  return server;
}

void serveStdio(createServer);
