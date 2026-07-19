import z from "zod";

export const todoMethodOutputSchema = z.object({
  id: z.uuid().describe("Unique identifier of the todo"),
  title: z.string().describe("Title of the todo"),
  description: z.string().describe("Description of the todo"),
  isCompleted: z.boolean().describe("Completion of the todo").default(false),
  createdAt: z.date().nullable().describe("Timestamp when the todo was created"),
  updatedAt: z.date().nullable().describe("Timestamp when the todo was last updated"),
});

export type TodoMethodOutputSchemaType = z.infer<typeof todoMethodOutputSchema>;

export const todoMethodInputSchema = z.object({
  title: z.string().describe("Title of the todo"),
  description: z.string().describe("Description of the todo"),
  isCompleted: z.boolean().describe("Completion of the todo").default(false),
});

export type TodoMethodInputSchemaType = z.infer<typeof todoMethodInputSchema>;

export const updateTodoMethodInputSchema = z.object({
  title: z.string().describe("Title of the todo").nullish(),
  description: z.string().describe("Description of the todo").nullish(),
  isCompleted: z.boolean().describe("Completion of the todo").default(false).nullish(),
});

export type UpdateTodoMethodInputSchemaType = z.infer<typeof updateTodoMethodInputSchema>;

export const deleteTodoMethodInputSchema = z.object({
  id: z.uuid().describe("Unique identifier of the todo"),
  title: z.string().describe("Title of the todo").nullish(),
  description: z.string().describe("Description of the todo").nullish(),
  isCompleted: z.boolean().describe("Completion of the todo").default(false).nullish(),
});

export type deleteTodoMethodInputSchemaType = z.infer<typeof deleteTodoMethodInputSchema>;

export const deleteMethodOutputSchema = z.object({
  success: z.boolean().describe("Indicates if the user was signed out successfully"),
  id: z.uuid().describe("Unique identifier of the todo"),
});

export type DeleteMethodOutputSchemaType = z.infer<typeof deleteMethodOutputSchema>;
