import { usersTable } from "@repo/database/models/user";
import {
  AuthMethodOutputSchemaType,
  SigninMethodInputSchemaType,
  SignoutMethodOutputSchemaType,
  SignupMethodInputSchemaType,
} from "./model";
import { TRPCError } from "@trpc/server";
import database, { eq } from "@repo/database";
import {
  generateRefreshToken,
  generateAccessToken,
  verifyRefreshToken,
  compareUserPassword,
  generateHashPassword,
} from "./middleware";
import { JwtPayload } from "jsonwebtoken";

class UserService {
  public async getUserByEmailAndPassword(db: typeof database, email: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return user || null;
  }

  public async signupMethod(
    db: typeof database,
    signupInput: SignupMethodInputSchemaType,
  ): Promise<AuthMethodOutputSchemaType> {
    const { firstName, lastName, email, password } = signupInput;

    if (!password) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Password input is required.",
      });
    }

    const isExistingUser = await this.getUserByEmailAndPassword(db, email);
    if (isExistingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A user account with this email address already exists.",
      });
    }

    const hashedPassword = await generateHashPassword(password, 10);

    const [newUser] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName,
        lastName: lastName,
      })
      .returning();

    if (!newUser) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create user account.",
      });
    }

    const accessToken = await generateAccessToken({ sub: newUser.id, role: newUser.role });
    const refreshToken = await generateRefreshToken({ sub: newUser.id, role: newUser.role });

    const [updatedUser] = await db
      .update(usersTable)
      .set({ refreshToken })
      .where(eq(usersTable.id, newUser.id))
      .returning();

    return {
      user: {
        id: newUser.id,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        refreshToken: updatedUser?.refreshToken ?? null,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      accessToken,
    };
  }

  public async signinMethod(
    db: typeof database,
    signinInput: SigninMethodInputSchemaType,
  ): Promise<AuthMethodOutputSchemaType> {
    const { email, password } = signinInput;

    if (!password) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Password input is required.",
      });
    }

    const user = await this.getUserByEmailAndPassword(db, email);
    if (!user || !user.password) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Invalid email or password." });
    }

    const validPassword = await compareUserPassword(password, user.password);

    if (!validPassword) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Invalid email or password." });
    }

    const accessToken = await generateAccessToken({ sub: user.id, role: user.role });
    const refreshToken = await generateRefreshToken({ sub: user.id, role: user.role });

    const [updatedUser] = await db
      .update(usersTable)
      .set({ refreshToken })
      .where(eq(usersTable.id, user.id))
      .returning();

    return {
      user: {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        refreshToken: updatedUser?.refreshToken ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
    };
  }

  public async signoutMethod(
    db: typeof database,
    userId: string,
  ): Promise<SignoutMethodOutputSchemaType> {
    await db.update(usersTable).set({ refreshToken: null }).where(eq(usersTable.id, userId));
    return {
      success: true,
      message: "Successfully signed out and sessions cleared.",
    };
  }

  public async refreshTokenMethod(
    db: typeof database,
    refreshToken: string,
  ): Promise<AuthMethodOutputSchemaType> {
    const decoded = (await verifyRefreshToken(refreshToken)) as JwtPayload;

    const userId = decoded?.sub || decoded?.id;
    if (!decoded || !userId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid refresh token." });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user || user.refreshToken !== refreshToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Token is invalid or has been revoked.",
      });
    }

    const accessToken = await generateAccessToken({ sub: user.id, role: user.role });
    const newRefreshToken = await generateRefreshToken({ sub: user.id, role: user.role });

    const [updatedUser] = await db
      .update(usersTable)
      .set({ refreshToken: newRefreshToken })
      .where(eq(usersTable.id, user.id))
      .returning();

    if (!updatedUser) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "User refresh token failed." });
    }

    return {
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        refreshToken: updatedUser.refreshToken,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      accessToken,
    };
  }
}

export default UserService;
