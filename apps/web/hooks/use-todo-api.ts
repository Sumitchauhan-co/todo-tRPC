"use client";

import { toast } from "sonner";
import type { RouterInputs, RouterOutputs } from "@repo/trpc/client";
import { trpc } from "~/trpc/client";

type Todo = RouterOutputs["todo"]["getTodos"][number];
type TodoCreateInput = RouterInputs["todo"]["createTodo"];
type TodoUpdateInput = RouterInputs["todo"]["updateTodo"];

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export function useTodos() {
  return trpc.todo.getTodos.useQuery(undefined, {
    refetchOnReconnect: true,
  });
}

export function useCreateTodo() {
  const utils = trpc.useUtils();

  return trpc.todo.createTodo.useMutation({
    async onMutate(input: TodoCreateInput) {
      await utils.todo.getTodos.cancel();

      const previousTodos = utils.todo.getTodos.getData();
      const optimisticTodo: Todo = {
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description,
        isCompleted: input.isCompleted ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      utils.todo.getTodos.setData(undefined, (currentTodos) => [
        optimisticTodo,
        ...(currentTodos ?? []),
      ]);

      return { previousTodos };
    },
    onError(error, _input, context) {
      utils.todo.getTodos.setData(undefined, context?.previousTodos);
      toast.error(getErrorMessage(error, "Todo could not be created."));
    },
    onSuccess() {
      toast.success("Todo created.");
    },
    onSettled() {
      void utils.todo.getTodos.invalidate();
    },
  });
}

export function useUpdateTodo() {
  const utils = trpc.useUtils();

  return trpc.todo.updateTodo.useMutation({
    async onMutate(input: TodoUpdateInput) {
      await utils.todo.getTodos.cancel();

      const previousTodos = utils.todo.getTodos.getData();
      utils.todo.getTodos.setData(undefined, (currentTodos) =>
        currentTodos?.map((todo) =>
          todo.id === input.id
            ? {
                ...todo,
                title: input.title ?? todo.title,
                description: input.description ?? todo.description,
                isCompleted: input.isCompleted ?? todo.isCompleted,
                updatedAt: new Date().toISOString(),
              }
            : todo,
        ),
      );

      return { previousTodos };
    },
    onError(error, _input, context) {
      utils.todo.getTodos.setData(undefined, context?.previousTodos);
      toast.error(getErrorMessage(error, "Todo could not be updated."));
    },
    onSettled() {
      void utils.todo.getTodos.invalidate();
    },
  });
}

export function useDeleteTodo() {
  const utils = trpc.useUtils();

  return trpc.todo.deleteTodo.useMutation({
    async onMutate(input) {
      await utils.todo.getTodos.cancel();

      const previousTodos = utils.todo.getTodos.getData();
      utils.todo.getTodos.setData(undefined, (currentTodos) =>
        currentTodos?.filter((todo) => todo.id !== input.id),
      );

      return { previousTodos };
    },
    onError(error, _input, context) {
      utils.todo.getTodos.setData(undefined, context?.previousTodos);
      toast.error(getErrorMessage(error, "Todo could not be deleted."));
    },
    onSuccess() {
      toast.success("Todo deleted.");
    },
    onSettled() {
      void utils.todo.getTodos.invalidate();
    },
  });
}
