import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({
    errorFormatter({ shape }) {
      return {
        ...shape,
        data: {
          ...shape.data,
        },
      };
    },
  });

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const protectedProcedure = tRPCContext.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Your session has expired or is invalid. Please sign in again.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
