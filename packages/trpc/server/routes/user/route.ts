import { z } from "../../schema";
import { userService } from "../../services";
import { publicProcedure, router } from "../../trpc";
import {
  authMethodOutputSchema,
  signinMethodInputSchema,
  signinWithGoogleInputSchema,
  signinWithProtoAuthInputSchema,
  signoutMethodInputSchema,
  signoutMethodOutputSchema,
  signupMethodInputSchema,
} from "@repo/services/user/model";
import { generatePath } from "../../utils/path-generator";
import { TRPCError } from "@trpc/server";

const TAGS = ["Authentication"];
const getPath = generatePath("/auth");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const authRouter = router({
  signup: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/signup"), tags: TAGS } })
    .input(signupMethodInputSchema)
    .output(z.readonly(authMethodOutputSchema))
    .mutation(async ({ ctx, input }) => {
      const { accessToken, user } = await userService.signupMethod(ctx.db, input);

      ctx.res.cookie("refreshToken", user.refreshToken, COOKIE_OPTIONS);

      return { user, accessToken };
    }),

  signin: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/signin"), tags: TAGS } })
    .input(signinMethodInputSchema)
    .output(z.readonly(authMethodOutputSchema))
    .mutation(async ({ ctx, input }) => {
      const { accessToken, user } = await userService.signinMethod(ctx.db, input);

      ctx.res.cookie("refreshToken", user.refreshToken, COOKIE_OPTIONS);

      return { user, accessToken };
    }),

  refresh: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/refresh"), tags: TAGS } })
    .input(z.object({}))
    .output(z.readonly(authMethodOutputSchema))
    .mutation(async ({ ctx }) => {
      const currentRefreshToken = ctx.req.cookies?.refreshToken;

      if (!currentRefreshToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Refresh token is missing. Please log in again.",
        });
      }

      const { user, accessToken } = await userService.refreshTokenMethod(
        ctx.db,
        currentRefreshToken,
      );

      ctx.res.cookie("refreshToken", user.refreshToken, COOKIE_OPTIONS);

      return { user, accessToken };
    }),

  signout: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/signout"), tags: TAGS } })
    .input(signoutMethodInputSchema)
    .output(z.readonly(signoutMethodOutputSchema))
    .mutation(async ({ ctx }) => {
      ctx.res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      const userId = ctx.user?.id;

      if (userId) {
        await userService.signoutMethod(ctx.db, userId);
      }

      return {
        success: true,
        message: "Successfully signed out and sessions cleared.",
      };
    }),

  signinWithGoogle: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/signinWithGoogle"), tags: TAGS } })
    .input(signinWithGoogleInputSchema)
    .output(z.readonly(authMethodOutputSchema))
    .mutation(async ({ ctx, input }) => {
      const { accessToken, user } = await userService.signinWithGoogle(ctx.db, input.code);

      if (user.refreshToken) {
        ctx.res.cookie("refreshToken", user.refreshToken, COOKIE_OPTIONS);
      }

      return {
        user,
        accessToken,
      };
    }),

  signinWithProtoAuth: publicProcedure
    .input(signinWithProtoAuthInputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await userService.signinWithProtoAuth(ctx.db, input.code, input.codeVerifier);

      if (result.user.refreshToken) {
        ctx.res.cookie("refreshToken", result.user.refreshToken, COOKIE_OPTIONS);
      }

      return result;
    }),

  me: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/me"), tags: TAGS } })
    .input(z.object({}))
    .output(z.readonly(authMethodOutputSchema.pick({ user: true })))
    .query(async ({ ctx }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No active session found.",
        });
      }

      const user = await userService.me(ctx.db, ctx.user.id);

      return { user };
    }),
});
