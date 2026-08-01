"use client";

import { Suspense, useMemo, useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Loader2, CalendarCheck2 } from "lucide-react";
import { toast } from "sonner";

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

// Modular components
import { CreateTodoForm } from "~/features/todos/components/CreateTodoForm";
import { TodoFilters, FilterMode } from "~/features/todos/components/TodoFilters";
import { TodoItem } from "~/features/todos/components/TodoItem";
import { AuthBox } from "~/features/todos/components/AuthBox";
import { TodoStats } from "~/features/todos/components/TodoStats";

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
    if (codeVerifier) localStorage.removeItem("protoauth_code_verifier");

    signinWithProtoAuth.mutate(
      { code, codeVerifier },
      {
        onSuccess(data: any) {
          if (data?.accessToken) setAccessToken(data.accessToken);
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
            if (data?.accessToken) setAccessToken(data.accessToken);
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
            toast.success("Account created successfully!");
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
            toast.success("Signed in successfully!");
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
      { onSuccess: () => createTodoForm.reset() },
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
      { onSuccess: () => setEditingId(null) },
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

  const startEditing = (todo: any) => {
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
              <h1 className="text-4xl font-semibold tracking-normal md:text-6xl">Todo Studio</h1>
            </div>
            <TodoStats total={todos.length} active={activeCount} completed={completedCount} />
          </div>

          <AuthBox
            isAuthenticated={isAuthenticated}
            userEmail={meQuery.data?.user?.email}
            isAuthLoading={isAuthLoading}
            authMode={authMode}
            setAuthMode={setAuthMode}
            authForm={authForm}
            onAuthSubmit={onAuthSubmit}
            onSignOut={handleSignOut}
            onGoogleLogin={() => handleGoogleLogin()}
            isGooglePending={signinWithGoogle.isPending}
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 md:grid-cols-[360px_1fr] md:px-8 lg:px-10">
        <CreateTodoForm
          form={createTodoForm}
          onSubmit={onCreateTodoSubmit}
          isPending={createTodo.isPending}
        />

        <div className="min-w-0">
          <TodoFilters
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
          />

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
              {visibleTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isEditing={editingId === todo.id}
                  editForm={editTodoForm}
                  onEditSubmit={onEditTodoSubmit}
                  onStartEditing={startEditing}
                  onToggleComplete={(checked) =>
                    updateTodo.mutate({ id: todo.id, isCompleted: checked })
                  }
                  onDelete={() => deleteTodo.mutate({ id: todo.id })}
                  isPending={updateTodo.isPending || deleteTodo.isPending}
                />
              ))}
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
