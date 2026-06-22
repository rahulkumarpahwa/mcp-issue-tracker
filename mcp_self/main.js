import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
// import apiBasedTools from "./api-based-tools.js";
import jobsBasedTools from "./jobs-based-tools.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new McpServer({
  name: "issue-server",
  version: "1.0.0",
});

// apiBasedTools(server); // this will register the API-based tools to the server, which will allow the model to interact with the API-based backend for the issue tracker application. The tools will be used to perform various operations like listing issues, creating issues, updating issues, and deleting issues through the API endpoints defined in the backend. The tools will also handle authentication and error handling for the API requests, making it easier for the model to interact with the backend and perform the necessary operations on the issues data.

jobsBasedTools(server); // this will register the job-based tools to the server, which will allow the model to interact with the job-based backend for the issue tracker application. The tools will be used to perform various operations like creating issues, updating issues, and deleting issues through the job-based system defined in the backend. The tools will handle authentication and error handling for the job-based requests, making it easier for the model to interact with the backend and perform the necessary operations on the issues data.

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
            resolve(rows.map((row) => row.sql + ";").join("\n "));
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

// when we attach a resource or a big file, we are attaching it as the resource. here the file act as the resource we attach to the claude and we will get the data accessed in it.
// similar cases would be when we attach the google drive and get accessed to the pdf or any docs or sheet to get our answers out of that.

// Now, we will ask the questions to the claude like, "Explain me the schema in plain english for my github style issue tracker"
// so, we can add the resources ourself we we want to ask the questions or understand that.
