import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export interface tokenPayload {
  sub: string;
  role: "user" | "admin";
}

export async function generateHashPassword(password: string, saltRounds: number) {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

export const compareUserPassword = async (userPassword: string, hashPassword: string) => {
  return bcrypt.compare(userPassword, hashPassword);
};

export async function generateRefreshToken(payload: tokenPayload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET_TOKEN!, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || ("1h" as any),
  });
}

export const generateAccessToken = async (payload: tokenPayload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET_TOKEN!, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || ("15m" as any),
  });
};

export const verifyAccessToken = async (token: string) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET_TOKEN!);
};

export const verifyRefreshToken = async (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET_TOKEN!);
};

export const verifyProtoAuthToken = async (token: string) => {
  const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");

  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || typeof decodedHeader === "string") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Malformed token." });
  }

  const alg = decodedHeader.header.alg;

  console.log(`Verifying token with algorithm: ${alg}`);

  if (alg === "RS256") {
    if (!publicKey) {
      throw new Error("JWT_PUBLIC_KEY is missing for RS256 token verification.");
    }
    return jwt.verify(token, publicKey, { algorithms: ["RS256"] });
  }

  throw new TRPCError({ 
    code: "BAD_REQUEST", 
    message: `Unsupported or unexpected algorithm: ${alg}. Expected RS2.56.` 
  });
};
