import { z } from "../../schema";
import { userService } from "../../services";
import { publicProcedure, router } from "../../trpc";
import {
  authMethodOutputSchema,
  signinMethodInputSchema,
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
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
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
});
