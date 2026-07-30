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

console.log(env.CLIENT_URL)

app.use(
  cors({
    origin: env.CLIENT_URL,
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