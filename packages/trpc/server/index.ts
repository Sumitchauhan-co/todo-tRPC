import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { todoRouter } from "./routes/todo/route";
import { authRouter } from "./routes/user/route";

export const serverRouter = router({
  health: healthRouter,
  todo: todoRouter,
  auth: authRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
