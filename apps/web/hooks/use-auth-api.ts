import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { getErrorMessage } from "./use-todo-api";

export function useSignIn() {
  const utils = trpc.useUtils();

  return trpc.auth.signin.useMutation({
    onSuccess(data) {
      utils.invalidate();
      toast.success(`Welcome back, ${data.user.firstName}.`);
    },
    onError(error) {
      toast.error(getErrorMessage(error, "Sign in failed."));
    },
  });
}

export function useSignUp() {
  const utils = trpc.useUtils();

  return trpc.auth.signup.useMutation({
    onSuccess(data) {
      utils.invalidate();
      toast.success(`Welcome, ${data.user.firstName}.`);
    },
    onError(error) {
      toast.error(getErrorMessage(error, "Sign up failed."));
    },
  });
}

export function useRefresh() {
  return trpc.auth.refresh.useMutation({
    onError(error) {
      toast.error(getErrorMessage(error, "Session expired. Please log in again."));
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return trpc.auth.signout.useMutation({
    onSuccess(data) {
      toast.success(data.message || "Signed out successfully.");
    },
    onError(error) {
      toast.error(getErrorMessage(error, "Sign out encountered an issue. Local session cleared."));
    },
    onSettled() {
      queryClient.clear();
    },
  });
}
