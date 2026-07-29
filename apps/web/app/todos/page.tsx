"use client";

import { Suspense, useMemo, useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarCheck2,
  Check,
  Circle,
  ClipboardList,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

import SigninWithProtoAuth from "~/features/auth/components/SigninWithProtoAuth";

import { useCreateTodo, useDeleteTodo, useTodos, useUpdateTodo } from "~/hooks/use-todo-api";
import {
  useSignIn,
  useSignUp,
  useSignOut,
  useSigninWithGoogle,
  useSigninWithProtoAuth,
  useMe,
} from "~/hooks/use-auth-api";
import { setAccessToken, getAccessToken } from "~/trpc/create-client";

type FilterMode = "all" | "active" | "done";

const filterLabels: Record<FilterMode, string> = {
  all: "All",
  active: "Active",
  done: "Done",
};

interface AuthFormInputs {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
}

interface CreateTodoInputs {
  title: string;
  description: string;
}

interface EditTodoInputs {
  editTitle: string;
  editDescription: string;
}

// 1. Wrap the main page content inside a separate inner component
function TodosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const meQuery = useMe();
  const todosQuery = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const signOut = useSignOut();
  const signinWithGoogle = useSigninWithGoogle();
  const signinWithProtoAuth = useSigninWithProtoAuth();

  const processedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code || processedCodeRef.current === code) return;

    const codeVerifier = localStorage.getItem("protoauth_code_verifier") || undefined;
    processedCodeRef.current = code;
    if (codeVerifier) {
      localStorage.removeItem("protoauth_code_verifier");
    }

    signinWithProtoAuth.mutate(
      { code, codeVerifier },
      {
        onSuccess(data: any) {
          if (data?.accessToken) {
            setAccessToken(data.accessToken);
          }
          meQuery.refetch();
          todosQuery.refetch();
          toast.success("Successfully logged in with ProtoAuth!");
          router.replace("/todos");
        },
        onError(error) {
          toast.error(error.message || "ProtoAuth sign-in failed.");
          router.replace("/todos");
        },
      },
    );
  }, [searchParams, router, meQuery, todosQuery, signinWithProtoAuth]);

  const isAuthenticated = Boolean(meQuery.data?.user) || Boolean(getAccessToken());

  const handleGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse: any) => {
      signinWithGoogle.mutate(
        { code: codeResponse.code },
        {
          onSuccess(data: any) {
            if (data?.accessToken) {
              setAccessToken(data.accessToken);
            }
            meQuery.refetch();
            todosQuery.refetch();
            toast.success("Successfully logged in with Google!");
          },
          onError(error) {
            toast.error(error.message || "Google sign-in failed.");
          },
        },
      );
    },
    onError: () => toast.error("Google login pop-up failed or was closed."),
  });

  const authForm = useForm<AuthFormInputs>({
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  const createTodoForm = useForm<CreateTodoInputs>({
    defaultValues: { title: "", description: "" },
  });

  const editTodoForm = useForm<EditTodoInputs>({
    defaultValues: { editTitle: "", editDescription: "" },
  });

  const onAuthSubmit = (data: AuthFormInputs) => {
    if (authMode === "signup") {
      signUp.mutate(
        {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email,
          password: data.password,
        },
        {
          onSuccess(res: any) {
            if (res?.accessToken) setAccessToken(res.accessToken);
            meQuery.refetch();
            todosQuery.refetch();
            authForm.reset();
          },
        },
      );
    } else {
      signIn.mutate(
        { email: data.email, password: data.password },
        {
          onSuccess(res: any) {
            if (res?.accessToken) setAccessToken(res.accessToken);
            meQuery.refetch();
            todosQuery.refetch();
            authForm.reset();
          },
        },
      );
    }
  };

  const onCreateTodoSubmit = (data: CreateTodoInputs) => {
    if (!data.title.trim() || !data.description.trim()) {
      toast.error("Add a title and description first.");
      return;
    }
    createTodo.mutate(
      { title: data.title.trim(), description: data.description.trim(), isCompleted: false },
      {
        onSuccess() {
          createTodoForm.reset();
        },
      },
    );
  };

  const onEditTodoSubmit = (data: EditTodoInputs) => {
    if (!editingId) return;
    if (!data.editTitle.trim() || !data.editDescription.trim()) {
      toast.error("Edited todos need a title and description.");
      return;
    }
    updateTodo.mutate(
      { id: editingId, title: data.editTitle.trim(), description: data.editDescription.trim() },
      {
        onSuccess() {
          setEditingId(null);
        },
      },
    );
  };

  const handleSignOut = () => {
    signOut.mutate(
      {},
      {
        onSuccess() {
          setAccessToken(null);
          meQuery.refetch();
          todosQuery.refetch();
          toast.success("Signed out successfully.");
        },
        onError(error) {
          setAccessToken(null);
          toast.error(
            error.message || "Sign out encountered an issue, but local session was cleared.",
          );
        },
      },
    );
  };

  const startEditing = (todo: (typeof todos)[number]) => {
    setEditingId(todo.id);
    editTodoForm.setValue("editTitle", todo.title);
    editTodoForm.setValue("editDescription", todo.description);
  };

  const todos = useMemo(() => todosQuery.data ?? [], [todosQuery.data]);
  const completedCount = todos.filter((todo) => todo.isCompleted).length;
  const activeCount = todos.length - completedCount;

  const visibleTodos = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return todos.filter((todo) => {
      const matchesSearch =
        !normalizedSearch ||
        todo.title.toLowerCase().includes(normalizedSearch) ||
        todo.description.toLowerCase().includes(normalizedSearch);
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !todo.isCompleted) ||
        (filter === "done" && todo.isCompleted);
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, todos]);

  const isAuthLoading =
    meQuery.isLoading ||
    signIn.isPending ||
    signUp.isPending ||
    signOut.isPending ||
    signinWithGoogle.isPending ||
    signinWithProtoAuth.isPending;

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#18201c]">
      <section className="border-b border-[#1f3427]/10 bg-[#e8f0db]">
        <div className="mx-auto grid min-h-[38vh] w-full max-w-7xl gap-8 px-5 py-8 md:grid-cols-[1fr_380px] md:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-md bg-[#18201c] text-white">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-normal md:text-6xl">Todo Studio</h1>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-[#1f3427]/10 bg-white/70 p-4">
                <p className="text-sm text-[#68715f]">Total</p>
                <p className="mt-2 text-3xl font-semibold">{todos.length}</p>
              </div>
              <div className="rounded-md border border-[#1f3427]/10 bg-white/70 p-4">
                <p className="text-sm text-[#68715f]">Active</p>
                <p className="mt-2 text-3xl font-semibold">{activeCount}</p>
              </div>
              <div className="rounded-md border border-[#1f3427]/10 bg-white/70 p-4">
                <p className="text-sm text-[#68715f]">Finished</p>
                <p className="mt-2 text-3xl font-semibold">{completedCount}</p>
              </div>
            </div>
          </div>

          <div className="self-end rounded-md border border-[#1f3427]/10 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {isAuthenticated ? "Session ready" : "Connect account"}
                </p>
                <p className="text-sm text-[#68715f]">
                  {isAuthenticated
                    ? `Logged in as ${meQuery.data?.user?.email ?? "User"}`
                    : "Required for create/edit/delete todo."}
                </p>
              </div>
              <Badge variant={isAuthenticated ? "default" : "outline"}>
                {isAuthenticated ? "Authed" : "Guest"}
              </Badge>
            </div>

            {isAuthLoading && !meQuery.data ? (
              <div className="flex min-h-[120px] items-center justify-center">
                <Loader2 className="size-6 animate-spin text-[#68715f]" />
              </div>
            ) : isAuthenticated ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
                disabled={isAuthLoading}
              >
                {signOut.isPending ? (
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
                  onClick={() => handleGoogleLogin()}
                  disabled={isAuthLoading}
                >
                  {signinWithGoogle.isPending ? (
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
                      <Input
                        {...authForm.register("firstName")}
                        placeholder="First name"
                        required
                      />
                      <Input {...authForm.register("lastName")} placeholder="Last name" required />
                    </div>
                  ) : null}

                  <div className="mt-2 grid gap-2">
                    <Input
                      type="email"
                      {...authForm.register("email")}
                      placeholder="Email"
                      required
                    />

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
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 md:grid-cols-[360px_1fr] md:px-8 lg:px-10">
        <form
          onSubmit={createTodoForm.handleSubmit(onCreateTodoSubmit)}
          className="h-fit rounded-md border border-[#1f3427]/10 bg-white p-4 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-[#c46742]" />
            <h2 className="text-xl font-semibold">New task</h2>
          </div>
          <div className="grid gap-3">
            <Input
              {...createTodoForm.register("title")}
              placeholder="Ship dashboard polish"
              maxLength={120}
            />

            <Textarea
              {...createTodoForm.register("description")}
              placeholder="Capture the exact next action, owner, or acceptance note."
              rows={5}
            />

            <Button type="submit" disabled={createTodo.isPending}>
              {createTodo.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add todo
            </Button>
          </div>
        </form>

        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 rounded-md border border-[#1f3427]/10 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#68715f]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Search tasks"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(filterLabels) as FilterMode[]).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={filter === mode ? "default" : "outline"}
                  onClick={() => setFilter(mode)}
                >
                  {filterLabels[mode]}
                </Button>
              ))}
            </div>
          </div>

          {todosQuery.isLoading ? (
            <div className="grid min-h-72 place-items-center rounded-md border border-[#1f3427]/10 bg-white">
              <Loader2 className="size-8 animate-spin text-[#5c684e]" />
            </div>
          ) : visibleTodos.length === 0 ? (
            <div className="grid min-h-72 place-items-center rounded-md border border-dashed border-[#1f3427]/20 bg-white p-8 text-center">
              <div>
                <CalendarCheck2 className="mx-auto mb-3 size-9 text-[#c46742]" />
                <h2 className="text-2xl font-semibold">Nothing in this view</h2>
                <p className="mt-2 max-w-md text-sm text-[#68715f]">
                  Add a task or change your filters to bring work back into focus.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {visibleTodos.map((todo) => {
                const isEditing = editingId === todo.id;

                return (
                  <article
                    key={todo.id}
                    className="rounded-md border border-[#1f3427]/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex gap-3">
                      <Checkbox
                        checked={todo.isCompleted}
                        onCheckedChange={(checked) =>
                          updateTodo.mutate({
                            id: todo.id,
                            isCompleted: checked === true,
                          })
                        }
                        disabled={updateTodo.isPending}
                        aria-label="Toggle todo completion"
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <form
                            onSubmit={editTodoForm.handleSubmit(onEditTodoSubmit)}
                            className="grid gap-2"
                          >
                            <Input {...editTodoForm.register("editTitle")} />
                            <Textarea {...editTodoForm.register("editDescription")} rows={3} />
                          </form>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="break-words text-lg font-semibold">{todo.title}</h3>
                              <Badge variant={todo.isCompleted ? "default" : "outline"}>
                                {todo.isCompleted ? "Done" : "Active"}
                              </Badge>
                            </div>
                            <p className="mt-2 break-words text-sm leading-6 text-[#556052]">
                              {todo.description}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex shrink-0 items-start gap-2">
                        {isEditing ? (
                          <Button
                            type="button"
                            size="icon"
                            onClick={editTodoForm.handleSubmit(onEditTodoSubmit)}
                            disabled={updateTodo.isPending}
                            aria-label="Save todo"
                          >
                            <Save className="size-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => startEditing(todo)}
                            aria-label="Edit todo"
                          >
                            <Circle className="size-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => deleteTodo.mutate({ id: todo.id })}
                          disabled={deleteTodo.isPending}
                          aria-label="Delete todo"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function TodosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f6f4ee]">
          <Loader2 className="size-8 animate-spin text-[#5c684e]" />
        </div>
      }
    >
      <TodosContent />
    </Suspense>
  );
}
