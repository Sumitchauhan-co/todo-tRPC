CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"first_name" varchar(80) NOT NULL,
	"last_name" varchar(80),
	"email" varchar(255) NOT NULL,
	"password" varchar,
	"refresh_token" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
