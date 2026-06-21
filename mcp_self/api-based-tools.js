import { z } from "zod";

export default function apiBasedTools(server) { // this will define the tools for the API-based server for the model / mcp
  // server is the MCP server instance that we will use to register the tools. The tools will be used to interact with the API-based backend for the issue tracker application.
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

  // Helper function to make HTTP requests
  async function makeRequest(method, url, data = null, options = {}) {
    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    // Merge other options except headers (which we already handled)
    const { headers: _, ...otherOptions } = options;
    Object.assign(config, otherOptions); // Merge other options into config

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const result = await response.text();

      let jsonResult;
      try {
        jsonResult = JSON.parse(result);
      } catch {
        jsonResult = result; // If response is not JSON, return as text
      }

      return {
        status: response.status,
        data: jsonResult,
        headers: Object.fromEntries(response.headers.entries()), // Convert headers to a plain object
      };
    } catch (error) {
      return {
        status: 0, // Indicate network error or other issues
        error: error.message,
      };
    }
  }

  // Issues Tools

  server.registerTool( // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to get a list of issues with optional filtering based on various parameters like status, assigned user, tags, search query, pagination, priority, and creator. The tool will also require an API key for authentication. The input schema defines the expected parameters for the tool, and the implementation of the tool makes an HTTP GET request to the API endpoint to fetch the issues based on the provided parameters and returns the result in a structured format that can be easily consumed by the model.
    "issues-list",
    {
      title: "List Issues",
      description: "Get a list of issues with optional filtering",
      inputSchema: {
        status: z
          .enum(["not_started", "in_progress", "done"])
          .optional()
          .describe("Filter by status"),
        assigned_user_id: z
          .string()
          .optional()
          .describe("Filter by assigned user ID"),
        tag_ids: z.string().optional().describe("Comma-separated tag IDs"),
        search: z
          .string()
          .optional()
          .describe("Search in title and description"),
        page: z.number().optional().describe("Page number (default: 1)"),
        limit: z
          .number()
          .optional()
          .describe("Items per page (default: 10, max: 100)"),
        priority: z
          .enum(["low", "medium", "high"])
          .optional()
          .describe("Filter by priority"),
        created_by_user_id: z
          .string()
          .optional()
          .describe("Filter by creator user ID"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async (params) => {
      const { apiKey, ...queryParams } = params;
      const searchParams = new URLSearchParams();

      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value);
        }
      });

      const url = `${API_BASE_URL}/issues${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;

      const result = await makeRequest("GET", url, null, {
        headers: { "x-api-key": apiKey },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "issues-create", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to create a new issue with the provided parameters like title, description, status, priority, assigned user ID, and tag IDs. The tool will also require an API key for authentication. The input schema defines the expected parameters for the tool, and the implementation of the tool makes an HTTP POST request to the API endpoint to create a new issue with the provided parameters and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "Create Issue",
      description: "Create a new issue",
      inputSchema: {
        title: z.string().describe("Issue title"),
        description: z.string().optional().describe("Issue description"),
        status: z
          .enum(["not_started", "in_progress", "done"])
          .optional()
          .describe("Issue status"),
        priority: z
          .enum(["low", "medium", "high", "urgent"])
          .optional()
          .describe("Issue priority"),
        assigned_user_id: z.string().optional().describe("Assigned user ID"),
        tag_ids: z.array(z.number()).optional().describe("Array of tag IDs"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async (params) => {
      const { apiKey, ...issueData } = params;

      const result = await makeRequest(
        "POST",
        `${API_BASE_URL}/issues`,
        issueData,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "issues-get", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to get a specific issue by its ID. The tool will also require an API key for authentication. The input schema defines the expected parameters for the tool, and the implementation of the tool makes an HTTP GET request to the API endpoint to fetch the issue based on the provided ID and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "Get Issue by ID",
      description: "Get a specific issue by its ID",
      inputSchema: {
        id: z.number().describe("Issue ID"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ id, apiKey }) => {
      const result = await makeRequest(
        "GET",
        `${API_BASE_URL}/issues/${id}`,
        null,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "issues-update", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to update an existing issue by its ID with the provided parameters like title, description, status, priority, assigned user ID, and tag IDs. The tool will also require an API key for authentication. The input schema defines the expected parameters for the tool, and the implementation of the tool makes an HTTP PUT request to the API endpoint to update the issue based on the provided ID and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "Update Issue",
      description: "Update an existing issue",
      inputSchema: {
        id: z.number().describe("Issue ID"),
        title: z.string().optional().describe("Issue title"),
        description: z.string().optional().describe("Issue description"),
        status: z
          .enum(["not_started", "in_progress", "done"])
          .optional()
          .describe("Issue status"),
        priority: z
          .enum(["low", "medium", "high"])
          .optional()
          .describe("Issue priority"),
        assigned_user_id: z.string().optional().describe("Assigned user ID"),
        tag_ids: z.array(z.number()).optional().describe("Array of tag IDs"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async (params) => {
      const { id, apiKey, ...updateData } = params;

      const result = await makeRequest(
        "PUT",
        `${API_BASE_URL}/issues/${id}`,
        updateData,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "issues-delete", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to delete an existing issue by its ID. The tool will also require an API key for authentication. The input schema defines the expected parameters for the tool, and the implementation of the tool makes an HTTP DELETE request to the API endpoint to delete the issue based on the provided ID and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "Delete Issue",
      description: "Delete an issue by ID",
      inputSchema: {
        id: z.number().describe("Issue ID"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ id, apiKey }) => {
      const result = await makeRequest(
        "DELETE",
        `${API_BASE_URL}/issues/${id}`,
        null,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Tags Tools

  server.registerTool(
    "tags-list", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to get a list of all available tags. The tool will also require an API key for authentication. The input schema defines the expected parameters for the tool, and the implementation of the tool makes an HTTP GET request to the API endpoint to fetch the tags and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "List Tags",
      description: "Get all available tags",
      inputSchema: {
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ apiKey }) => {
      const result = await makeRequest("GET", `${API_BASE_URL}/tags`, null, {
        headers: { "x-api-key": apiKey },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "tags-create", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to create a new tag with the provided parameters like name and color. The tool will also require an API key for authentication. The input schema defines the expected parameters for the tool, and the implementation of the tool makes an HTTP POST request to the API endpoint to create a new tag with the provided parameters and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "Create Tag",
      description: "Create a new tag",
      inputSchema: {
        name: z.string().describe("Tag name"),
        color: z.string().describe("Tag color (hex format)"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async (params) => {
      const { apiKey, ...tagData } = params;

      const result = await makeRequest(
        "POST",
        `${API_BASE_URL}/tags`,
        tagData,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "tags-delete", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to delete an existing tag by its ID. The tool will also require an API key for authentication. The input schema defines the expected parameters for the tool, and the implementation of the tool makes an HTTP DELETE request to the API endpoint to delete the tag based on the provided ID and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "Delete Tag",
      description: "Delete a tag by ID",
      inputSchema: {
        id: z.number().describe("Tag ID"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ id, apiKey }) => {
      const result = await makeRequest(
        "DELETE",
        `${API_BASE_URL}/tags/${id}`,
        null,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Users Tools

  server.registerTool(
    "users-list", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to get a list of all users. The tool will also require an API key for authentication. The input schema defines the expected parameters for the tool, and the implementation of the tool makes an HTTP GET request to the API endpoint to fetch the users and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "List Users",
      description: "Get all users",
      inputSchema: {
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ apiKey }) => {
      const result = await makeRequest("GET", `${API_BASE_URL}/users`, null, {
        headers: { "x-api-key": apiKey },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // API Key Tools

  server.registerTool(
    "api-key-verify", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to verify if an API key is valid. The input schema defines the expected parameters for the tool, and the implementation of the tool makes an HTTP POST request to the API endpoint to verify the API key and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "Verify API Key",
      description: "Verify if an API key is valid",
      inputSchema: {
        apiKey: z.string().describe("API key to verify"),
      },
    },
    async ({ apiKey }) => {
      const result = await makeRequest(
        "POST",
        `${API_BASE_URL}/auth/api-key/verify`,
        { key: apiKey }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Health Check Tools

  server.registerTool(
    "health-status", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to get the health status of the API. The implementation of the tool makes an HTTP GET request to the API endpoint to fetch the health status and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "Health Status",
      description: "Get the health status of the API",
    },
    async () => {
      const result = await makeRequest(
        "GET",
        `${API_BASE_URL.replace("/api", "")}/health`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "health-ready", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to check if the API is ready to serve requests. The implementation of the tool makes an HTTP GET request to the API endpoint to check the readiness of the API and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "Readiness Probe",
      description: "Check if the API is ready to serve requests",
    },
    async () => {
      const result = await makeRequest(
        "GET",
        `${API_BASE_URL.replace("/api", "")}/health/ready`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "health-live", // this is the tool we register to the server, and we will use this tool to interact with the API-based backend for the issue tracker application. The tool will be used to check if the API is alive. The implementation of the tool makes an HTTP GET request to the API endpoint to check the liveness of the API and returns the result in a structured format that can be easily consumed by the model.
    {
      title: "Liveness Probe",
      description: "Check if the API is alive",
    },
    async () => {
      const result = await makeRequest(
        "GET",
        `${API_BASE_URL.replace("/api", "")}/health/live`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
