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
  verifyProtoAuthToken,
} from "./utils/token";
import { JwtPayload } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

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

  public async signinWithGoogle(
    db: typeof database,
    code: string,
  ): Promise<AuthMethodOutputSchemaType> {
    const googleClient = new OAuth2Client(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "postmessage",
    );

    const { tokens } = await googleClient.getToken(code);
    if (!tokens.id_token) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Failed to retrieve ID token from Google.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid Google token payload.",
      });
    }

    const email = payload.email.toLowerCase().trim();

    let user = await this.getUserByEmailAndPassword(db, email);

    if (!user) {
      const [newUser] = await db
        .insert(usersTable)
        .values({
          email: email,
          firstName: payload.given_name || "",
          lastName: payload.family_name || "",
        })
        .returning();

      if (!newUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user account from Google.",
        });
      }
      user = newUser;
    }

    const accessToken = await generateAccessToken({ sub: user.id, role: user.role });
    const refreshToken = await generateRefreshToken({ sub: user.id, role: user.role });

    const [updatedUser] = await db
      .update(usersTable)
      .set({ refreshToken })
      .where(eq(usersTable.id, user.id))
      .returning();

    if (!updatedUser) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to assign refresh token.",
      });
    }

    return {
      user: {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        refreshToken: updatedUser.refreshToken,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
    };
  }

  public async signinWithProtoAuth(
    db: typeof database,
    code: string,
    codeVerifier?: string,
  ): Promise<AuthMethodOutputSchemaType> {
    const protoAuthBackendUrl = process.env.PROTOAUTH_BACKEND_URL;
    try {

      const response = await axios.post(`${protoAuthBackendUrl}/o/token`, {
        code,
        client_id: process.env.NEXT_PUBLIC_PROTOAUTH_CLIENT_ID,
        client_secret: process.env.PROTOAUTH_CLIENT_SECRET,
        redirect_uri: process.env.PROTOAUTH_REDIRECT_URI,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      });

      const result = response.data?.data || response.data;
      const { id_token, access_token, refresh_token } = result;

      if (!id_token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to retrieve ID token from ProtoAuth.",
        });
      }

      const decoded = (await verifyProtoAuthToken(id_token)) as JwtPayload & {
        email?: string;
        given_name?: string;
        family_name?: string;
        name?: string;
        sub?: string; 
      };

      if (!decoded || !decoded.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid ID token payload.",
        });
      }

      const email = decoded.email?.toLowerCase().trim() || "";
      const firstName = decoded.given_name || "";
      const lastName = decoded.family_name || "";

      let user = null;
      const [existingUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      user = existingUser;

      if (!user) {
        const [newUser] = await db
          .insert(usersTable)
          .values({
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: "",
          })
          .returning();

        if (!newUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user account from ProtoAuth.",
          });
        }
        user = newUser;
      }

      const [updatedUser] = await db
        .update(usersTable)
        .set({ refreshToken: refresh_token })
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
        accessToken: access_token,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error("ProtoAuth Server Error Details:", error.response?.data);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to exchange code for token with ProtoAuth.",
        });
      }
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error?.message ||
          "An unexpected error occurred during ProtoAuth signin.",
        });
    }
  }

  public async me(
    db: typeof database,
    userId: string,
  ): Promise<AuthMethodOutputSchemaType["user"]> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User session not found or account removed.",
      });
    }

    return {
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      refreshToken: user.refreshToken,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
export default UserService;
