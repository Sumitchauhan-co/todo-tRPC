import {
  deleteMethodOutputSchema,
  deleteTodoMethodInputSchema,
  todoMethodInputSchema,
  todoMethodOutputSchema,
  updateTodoMethodInputSchema,
} from "@repo/services/todo/model";
import { z } from "../../schema";
import { todoService } from "../../services";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Todos"];
const getPath = generatePath("/todos");

export const todoRouter = router({
  getTodos: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/all-todos"), tags: TAGS } })
    .input(todoMethodInputSchema)
    .output(z.readonly(z.array(todoMethodOutputSchema)))
    .query(async ({ ctx }) => {
      return await todoService.getTodosMethod(ctx.db);
    }),

  createTodo: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/create-todo"), tags: TAGS } })
    .input(todoMethodInputSchema)
    .output(z.readonly(todoMethodOutputSchema))
    .query(async ({ ctx, input }) => {
      return await todoService.createTodoMethod(ctx.db, input);
    }),

  updateTodo: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/update-todo"), tags: TAGS } })
    .input(updateTodoMethodInputSchema)
    .output(z.readonly(todoMethodOutputSchema))
    .query(async ({ ctx, input }) => {
      return await todoService.updateTodoMethod(ctx.db, input);
    }),

  deleteTodo: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/delete-todo"), tags: TAGS } })
    .input(deleteTodoMethodInputSchema)
    .output(z.readonly(deleteMethodOutputSchema))
    .query(async ({ ctx, input }) => {
      return await todoService.deleteTodoMethod(ctx.db, input);
    }),
});
