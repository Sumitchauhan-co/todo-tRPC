// server.ts
import express from "express";
import cors from "cors";
import { logger } from "@repo/logger";
import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";
import { env } from "./env";
import cookieParser from "cookie-parser";

export const app = express();

const allowedOrigins = env.CLIENT_URL.split(",").map((url) => url.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests or CLI/Postman calls with no origin header
      if (!origin) return callback(null, true);

      // Allow local development origins automatically in dev mode
      if (env.NODE_ENV !== "production" && origin.includes("localhost")) {
        return callback(null, true);
      }

      // Check if the request origin matches allowed production client URLs
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error(`CORS policy: Origin ${origin} is not allowed.`));
    },
    credentials: true, // Crucial for HTTP-only cookies (refreshToken)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
    exposedHeaders: ["x-new-access-token", "set-cookie"],
  }),
);

app.use(express.json());
app.use(cookieParser());

// OpenAPI & Docs
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Streamyst OpenAPI",
  version: "1.0.0",
  baseUrl: env.NEXT_PUBLIC_API_URL.concat("/api"),
});

app.get("/", (req, res) => res.json({ message: "Streamyst is up and running..." }));
app.get("/health", (req, res) =>
  res.json({ message: "Streamyst server is healthy", healthy: true }),
);
app.get("/openapi.json", (req, res) => res.json(openApiDocument));
app.use("/docs", apiReference({ url: "/openapi.json" }));

// Endpoints
app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
