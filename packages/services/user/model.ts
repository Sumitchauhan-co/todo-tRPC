import z from "zod";

export const userProfileSchema = z.object({
  id: z.string().uuid().describe("Unique identifier of the user"),
  role: z.enum(["user", "admin"]).describe("Role of the user").default("user"),
  firstName: z.string().min(1).max(80).describe("First name of the user"),
  lastName: z.string().max(80).nullable().describe("Last name of the user"),
  email: z.email().max(255).describe("Email of the user"),
  refreshToken: z.string().nullable().describe("Current refresh token"),
  createdAt: z.date().nullable().describe("Timestamp when the user was created"),
  updatedAt: z.date().nullable().describe("Timestamp when the user was last updated"),
});

export const authMethodOutputSchema = z.object({
  user: userProfileSchema,
  accessToken: z.string().describe("Short-lived JWT access token for authorization headers"),
});

export type AuthMethodOutputSchemaType = z.infer<typeof authMethodOutputSchema>;

export const signupMethodInputSchema = z.object({
  firstName: z.string().min(1).max(80).describe("First name of the user"),
  lastName: z.string().max(80).describe("Last name of the user"),
  email: z.email().max(255).describe("Email of the user"),
  password: z.string().nullable().describe("Password of the user"),
});

export type SignupMethodInputSchemaType = z.infer<typeof signupMethodInputSchema>;

export const signinMethodInputSchema = z.object({
  email: z.email().max(255).describe("Email of the user"),
  password: z.string().nullable().describe("Password of the user"),
});

export type SigninMethodInputSchemaType = z.infer<typeof signinMethodInputSchema>;

export const signoutMethodInputSchema = z.object({});

export const signoutMethodOutputSchema = z.object({
  success: z.boolean().describe("Indicates if the user was signed out successfully"),
  message: z.string().describe("Status message summary"),
});

export type SignoutMethodOutputSchemaType = z.infer<typeof signoutMethodOutputSchema>;

export const signinWithProtoAuthInputSchema = z.object({
  code: z.string(),
  codeVerifier: z.string().optional(),
});

export const signinWithGoogleInputSchema = z.object({
  code: z.string(),
});
