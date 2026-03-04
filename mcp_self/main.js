import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import sqlite3 from "sqlite3";
import path, { resolve } from "path";
import { fileURLToPath } from "url";
import { rejects } from "assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new McpServer({
  name: "issue-server",
  version: "0.0.1",
});

server.registerResource(
  "database-schema",
  "schema://database", // URI
  {
    title: "DataBase Schema",
    description: "SQLITE schema for the issues database",
    mimeType: "text/plain", // telling the LLM how to interpret it.
  },
  async (uri) => {
    const dbPath = path.join(__dirname, "..", "backend", "database.sqlite"); // this database file in the backend we want the LLM to read here.

    const schema = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

      db.all(
        "SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL ORDER BY name ",
        (err, rows) => {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve(rows.map((row) => row.sql + ";")).join("\n ");
          }
        },
      );
    });

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/plain",
          text: schema,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
