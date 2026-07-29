import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { getErrorMessage } from "./use-todo-api";

export function useMe() {
  return trpc.auth.me.useQuery(
    {},
    {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  );
}

export function useSignIn() {
  const utils = trpc.useUtils();

  return trpc.auth.signin.useMutation({
    onSuccess(data) {
      utils.auth.me.invalidate();
      utils.todo.invalidate();
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
      utils.auth.me.invalidate();
      utils.todo.invalidate();
      toast.success(`Welcome, ${data.user.firstName}.`);
    },
    onError(error) {
      toast.error(getErrorMessage(error, "Sign up failed."));
    },
  });
}

export function useRefresh() {
  const utils = trpc.useUtils();

  return trpc.auth.refresh.useMutation({
    onSuccess() {
      utils.auth.me.invalidate();
    },
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

export function useSigninWithGoogle() {
  const utils = trpc.useUtils();

  return trpc.auth.signinWithGoogle.useMutation({
    onSuccess(data) {
      utils.auth.me.invalidate();
      utils.todo.invalidate();
      toast.success(`Welcome back, ${data.user.firstName}.`);
    },
    onError(error) {
      toast.error(getErrorMessage(error, "Sign in with Google failed."));
    },
  });
}

export function useSigninWithProtoAuth() {
  const utils = trpc.useUtils();

  return trpc.auth.signinWithProtoAuth.useMutation({
    onSuccess(data) {
      utils.auth.me.invalidate();
      utils.todo.invalidate();
      toast.success(`Welcome back, ${data.user.firstName}.`);
    },
    onError(error) {
      toast.error(getErrorMessage(error, "Sign in with ProtoAuth failed."));
    },
  });
}
