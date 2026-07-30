import * as trpcExpress from "@trpc/server/adapters/express";
import type { Request, Response } from "express";
import db from "@repo/database";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { userService } from "./services";

export interface ContextUser {
  id: string;
  role: string;
}

interface JwtPayload {
  sub: string;
  role: string;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

function getJwtAccessSecret() {
  return process.env.JWT_ACCESS_SECRET_TOKEN;
}

function getCookie(req: Request, name: string): string | undefined {
  if (req.cookies?.[name]) return req.cookies[name];

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([cookieName]) => cookieName === name)
    ?.at(1);
}

function getValidUserFromAccess(req: Request): ContextUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.split(" ")[1];
    if (!token) return null;

    const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");

    if (!publicKey) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "JWT public key missing" });
    }

    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
    }) as unknown as JwtPayload;

    return { id: decoded.sub, role: decoded.role };
  } catch (err) {
    console.error("Access token verification failed:", err);
    return null;
  }
}

async function getRefreshedUser(req: Request, res: Response): Promise<ContextUser | null> {
  const refreshToken =
    req.cookies?.refreshToken || getCookie(req, "refreshToken") || req.headers["x-refresh-token"];
  if (!refreshToken) return null;

  try {
    const { accessToken, user } = await userService.refreshTokenMethod(db, String(refreshToken));

    res.setHeader("x-new-access-token", accessToken);

    if (user.refreshToken) {
      res.cookie("refreshToken", user.refreshToken, COOKIE_OPTIONS);
    }

    const jwtAccessSecret = getJwtAccessSecret();
    if (!jwtAccessSecret) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "JWT access secret missing" });
    }

    const decoded = jwt.verify(accessToken, jwtAccessSecret) as JwtPayload;
    return { id: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}

export async function createContext({ req, res }: trpcExpress.CreateExpressContextOptions) {
  let user = getValidUserFromAccess(req);

  if (!user) {
    user = await getRefreshedUser(req, res);
  }

  return {
    req,
    res,
    db,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
