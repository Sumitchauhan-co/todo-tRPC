import { pgTable, uuid, varchar, timestamp, boolean, text } from "drizzle-orm/pg-core";

export const todosTable = pgTable("todos", {
  id: uuid("id").primaryKey().defaultRandom(),

  title: varchar("title").notNull(),
  description: text("description").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectTodo = typeof todosTable.$inferSelect;
export type InsertUTodo = typeof todosTable.$inferInsert;
