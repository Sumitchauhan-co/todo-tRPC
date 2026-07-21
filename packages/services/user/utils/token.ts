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
