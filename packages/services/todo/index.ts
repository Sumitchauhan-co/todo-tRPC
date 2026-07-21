import { todosTable } from "@repo/database/models/todo";
import {
  DeleteMethodOutputSchemaType,
  deleteTodoMethodInputSchemaType,
  TodoMethodInputSchemaType,
  TodoMethodOutputSchemaType,
  UpdateTodoMethodInputSchemaType,
} from "./model";
import { TRPCError } from "@trpc/server";
import database, { eq } from "@repo/database";

class TodoService {
  public async getTodosMethod(
    db: typeof database,
  ): Promise<ReadonlyArray<TodoMethodOutputSchemaType>> {
    const todos = await db.select().from(todosTable);

    return todos;
  }

  public async createTodoMethod(
    db: typeof database,
    createTodoInput: TodoMethodInputSchemaType,
  ): Promise<TodoMethodOutputSchemaType> {
    const [createdTodo] = await db
      .insert(todosTable)
      .values({
        title: createTodoInput.title,
        description: createTodoInput.description,
        isCompleted: createTodoInput.isCompleted,
      } as any)
      .returning();

    if (!createdTodo) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Todo failed to create" });
    }

    return createdTodo;
  }

  public async updateTodoMethod(
    db: typeof database,
    updateTodoInput: UpdateTodoMethodInputSchemaType,
  ): Promise<TodoMethodOutputSchemaType> {
    const { id, ...values } = updateTodoInput;
    const [updatedTodo] = await db
      .update(todosTable)
      .set(values)
      .where(eq(todosTable.id, id))
      .returning();

    if (!updatedTodo) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "The task you are trying to update does not exist.",
      });
    }

    return updatedTodo;
  }

  public async deleteTodoMethod(
    db: typeof database,
    deleteTodoInput: deleteTodoMethodInputSchemaType,
  ): Promise<DeleteMethodOutputSchemaType> {
    const [deletedTodo] = await db
      .delete(todosTable)
      .where(eq(todosTable.id, deleteTodoInput.id))
      .returning({ id: todosTable.id });

    if (!deletedTodo) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "The task you are trying to delete does not exist.",
      });
    }

    return {
      success: true,
      id: deletedTodo.id,
    };
  }
}

export default TodoService;
