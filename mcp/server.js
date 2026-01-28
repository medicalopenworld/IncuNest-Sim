#!/usr/bin/env node

/**
 * IncuNest Simulator MCP Server
 * Model Context Protocol server for accessing simulation data
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Simulated state (in production, this would connect to actual simulation)
let simulationState = {
  temperature: 36.5,
  humidity: 65,
  setpoint: 37.0,
  heaterOn: true,
  fanOn: true,
  timestamp: new Date().toISOString()
};

const server = new Server(
  {
    name: 'incunest-sim-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_simulation_state',
        description: 'Get current state of the incubator simulation',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'set_temperature_setpoint',
        description: 'Set the target temperature for the incubator',
        inputSchema: {
          type: 'object',
          properties: {
            temperature: {
              type: 'number',
              description: 'Target temperature in Celsius (30-40)',
              minimum: 30,
              maximum: 40,
            },
          },
          required: ['temperature'],
        },
      },
      {
        name: 'control_heater',
        description: 'Turn heater on or off',
        inputSchema: {
          type: 'object',
          properties: {
            state: {
              type: 'boolean',
              description: 'true to turn on, false to turn off',
            },
          },
          required: ['state'],
        },
      },
      {
        name: 'control_fan',
        description: 'Turn fan on or off',
        inputSchema: {
          type: 'object',
          properties: {
            state: {
              type: 'boolean',
              description: 'true to turn on, false to turn off',
            },
          },
          required: ['state'],
        },
      },
      {
        name: 'get_sensor_history',
        description: 'Get historical sensor data',
        inputSchema: {
          type: 'object',
          properties: {
            duration: {
              type: 'number',
              description: 'Duration in seconds to retrieve',
              default: 3600,
            },
          },
          required: [],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_simulation_state':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(simulationState, null, 2),
            },
          ],
        };

      case 'set_temperature_setpoint':
        if (!args || typeof args.temperature !== 'number') {
          throw new Error('Invalid temperature value');
        }
        if (args.temperature < 30 || args.temperature > 40) {
          throw new Error('Temperature must be between 30 and 40°C');
        }
        simulationState.setpoint = args.temperature;
        simulationState.timestamp = new Date().toISOString();
        return {
          content: [
            {
              type: 'text',
              text: `Temperature setpoint updated to ${args.temperature}°C`,
            },
          ],
        };

      case 'control_heater':
        if (!args || typeof args.state !== 'boolean') {
          throw new Error('Invalid state value');
        }
        simulationState.heaterOn = args.state;
        simulationState.timestamp = new Date().toISOString();
        return {
          content: [
            {
              type: 'text',
              text: `Heater turned ${args.state ? 'ON' : 'OFF'}`,
            },
          ],
        };

      case 'control_fan':
        if (!args || typeof args.state !== 'boolean') {
          throw new Error('Invalid state value');
        }
        simulationState.fanOn = args.state;
        simulationState.timestamp = new Date().toISOString();
        return {
          content: [
            {
              type: 'text',
              text: `Fan turned ${args.state ? 'ON' : 'OFF'}`,
            },
          ],
        };

      case 'get_sensor_history':
        const duration = args?.duration || 3600;
        // In a real implementation, this would query a database
        const history = Array.from({ length: 10 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * (duration / 10) * 1000).toISOString(),
          temperature: 36.5 + Math.random() * 1.0,
          humidity: 65 + Math.random() * 5,
        }));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(history, null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('IncuNest Simulator MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
