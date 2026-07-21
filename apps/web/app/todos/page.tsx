"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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

import { useSignIn, useSignUp, useSignOut } from "~/hooks/use-auth-api";
import { useCreateTodo, useDeleteTodo, useTodos, useUpdateTodo } from "~/hooks/use-todo-api";

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

export default function TodosPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // tRPC / API Hooks
  const todosQuery = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const signOut = useSignOut();

  // Auth Form (SignIn & SignUp)
  const authForm = useForm<AuthFormInputs>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  // Create Todo Form
  const createTodoForm = useForm<CreateTodoInputs>({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // 3. Edit Todo Form
  const editTodoForm = useForm<EditTodoInputs>({
    defaultValues: {
      editTitle: "",
      editDescription: "",
    },
  });

  // Form Submission Handlers

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
          onSuccess() {
            setIsAuthenticated(true);
            authForm.reset();
          },
        },
      );
    } else {
      signIn.mutate(
        {
          email: data.email,
          password: data.password,
        },
        {
          onSuccess() {
            setIsAuthenticated(true);
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
      {
        title: data.title.trim(),
        description: data.description.trim(),
        isCompleted: false,
      },
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
      {
        id: editingId,
        title: data.editTitle.trim(),
        description: data.editDescription.trim(),
      },
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
          setIsAuthenticated(false);
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

  const isAuthLoading = signIn.isPending || signUp.isPending || signOut.isPending;

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

          {/* Auth Card */}
          <div className="self-end rounded-md border border-[#1f3427]/10 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {isAuthenticated ? "Session ready" : "Connect account"}
                </p>
                <p className="text-sm text-[#68715f]">
                  {isAuthenticated
                    ? "Authenticated via HTTP-only cookie."
                    : "Required for create/edit/delete todo."}
                </p>
              </div>
              <Badge variant={isAuthenticated ? "default" : "outline"}>
                {isAuthenticated ? "Authed" : "Guest"}
              </Badge>
            </div>

            {isAuthenticated ? (
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
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input {...authForm.register("firstName")} placeholder="First name" required />
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
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 md:grid-cols-[360px_1fr] md:px-8 lg:px-10">
        {/* Create Todo Form */}
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

        {/* Todo List Area */}
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
