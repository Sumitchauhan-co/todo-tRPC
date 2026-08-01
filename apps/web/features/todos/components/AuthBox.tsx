"use client";

import { UseFormReturn } from "react-hook-form";
import { Loader2, LogIn, UserPlus, Check, LogOut } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import SigninWithProtoAuth from "~/features/auth/components/SigninWithProtoAuth";

interface AuthFormInputs {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
}

interface AuthBoxProps {
  isAuthenticated: boolean;
  userEmail?: string;
  isAuthLoading: boolean;
  authMode: "signin" | "signup";
  setAuthMode: (mode: "signin" | "signup") => void;
  authForm: UseFormReturn<AuthFormInputs>;
  onAuthSubmit: (data: AuthFormInputs) => void;
  onSignOut: () => void;
  onGoogleLogin: () => void;
  isGooglePending: boolean;
}

export function AuthBox({
  isAuthenticated,
  userEmail,
  isAuthLoading,
  authMode,
  setAuthMode,
  authForm,
  onAuthSubmit,
  onSignOut,
  onGoogleLogin,
  isGooglePending,
}: AuthBoxProps) {
  return (
    <div className="self-end rounded-md border border-[#1f3427]/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            {isAuthenticated ? "Session ready" : "Connect account"}
          </p>
          <p className="text-sm text-[#68715f]">
            {isAuthenticated
              ? `Logged in as ${userEmail ?? "User"}`
              : "Required for create/edit/delete todo."}
          </p>
        </div>
        <Badge variant={isAuthenticated ? "default" : "outline"}>
          {isAuthenticated ? "Authed" : "Guest"}
        </Badge>
      </div>

      {isAuthLoading && !isAuthenticated ? (
        <div className="flex min-h-[120px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#68715f]" />
        </div>
      ) : isAuthenticated ? (
        <Button
          variant="destructive"
          className="w-full"
          onClick={onSignOut}
          disabled={isAuthLoading}
        >
          {isAuthLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Sign out
        </Button>
      ) : (
        <div className="grid gap-2.5">
          <SigninWithProtoAuth />

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 border-gray-300 font-medium text-gray-700 hover:bg-gray-50"
            onClick={onGoogleLogin}
            disabled={isAuthLoading}
          >
            {isGooglePending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative my-1 flex items-center">
            <div className="w-full border-t border-gray-200" />
            <span className="shrink-0 px-2 text-xs uppercase text-[#68715f]">Or</span>
            <div className="w-full border-t border-gray-200" />
          </div>

          <form onSubmit={authForm.handleSubmit(onAuthSubmit)}>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={authMode === "signin" ? "default" : "outline"}
                onClick={() => setAuthMode("signin")}
              >
                <LogIn className="size-4" />
                Sign in
              </Button>
              <Button
                type="button"
                variant={authMode === "signup" ? "default" : "outline"}
                onClick={() => setAuthMode("signup")}
              >
                <UserPlus className="size-4" />
                Sign up
              </Button>
            </div>

            {authMode === "signup" ? (
              <div className="mb-2 grid gap-2 sm:grid-cols-2">
                <Input {...authForm.register("firstName")} placeholder="First name" required />
                <Input {...authForm.register("lastName")} placeholder="Last name" required />
              </div>
            ) : null}

            <div className="mt-2 grid gap-2">
              <Input type="email" {...authForm.register("email")} placeholder="Email" required />
              <Input
                type="password"
                {...authForm.register("password")}
                placeholder="Password"
                required
              />

              <Button type="submit" disabled={isAuthLoading}>
                {isAuthLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Continue
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
