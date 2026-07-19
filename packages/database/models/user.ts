import { pgEnum } from "drizzle-orm/pg-core";
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  role: userRoleEnum("role").default("user").notNull(),

  firstName: varchar("first_name", { length: 80 }).notNull(),
  lastName: varchar("last_name", { length: 80 }),

  email: varchar("email", { length: 255 }).notNull().unique(),

  password: varchar("password"),

  refreshToken: varchar("refresh_token"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
