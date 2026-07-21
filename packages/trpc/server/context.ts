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

function getJwtAccessSecret() {
  return process.env.JWT_ACCESS_SECRET_TOKEN;
}

function getCookie(req: Request, name: string): string | undefined {
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

    if (!token) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Missing or invalid authorization token" });
    }

    const jwtAccessSecret = getJwtAccessSecret();
    if (!jwtAccessSecret) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "JWT access secret missing" });
    }

    const decoded = jwt.verify(token, jwtAccessSecret) as unknown as JwtPayload;
    return { id: decoded.sub, role: decoded.role };
  } catch {
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

    res.cookie("refreshToken", user.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

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
