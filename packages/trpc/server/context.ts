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

function getValidUserFromAccess(req: Request): ContextUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Missing or invalid authorization token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as unknown as JwtPayload;
    return { id: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}

async function getRefreshedUser(req: Request, res: Response): Promise<ContextUser | null> {
  const refreshToken = req.cookies?.refresh_token || req.headers["x-refresh-token"];
  if (!refreshToken) return null;

  try {
    const { accessToken, user } = await userService.refreshTokenMethod(db, String(refreshToken));

    res.setHeader("x-new-access-token", accessToken);

    res.cookie("refresh_token", user.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!) as any;
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
