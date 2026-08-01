import { UseFormReturn } from "react-hook-form";
import { Save, Circle, Trash2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

interface EditTodoInputs {
  editTitle: string;
  editDescription: string;
}

interface TodoItemProps {
  todo: any;
  isEditing: boolean;
  editForm: UseFormReturn<EditTodoInputs>;
  onEditSubmit: (data: EditTodoInputs) => void;
  onStartEditing: (todo: any) => void;
  onToggleComplete: (checked: boolean) => void;
  onDelete: () => void;
  isPending: boolean;
}

export function TodoItem({
  todo,
  isEditing,
  editForm,
  onEditSubmit,
  onStartEditing,
  onToggleComplete,
  onDelete,
  isPending,
}: TodoItemProps) {
  return (
    <article className="rounded-md border border-[#1f3427]/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex gap-3">
        <Checkbox
          checked={todo.isCompleted}
          onCheckedChange={(checked) => onToggleComplete(checked === true)}
          disabled={isPending}
          aria-label="Toggle todo completion"
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="grid gap-2">
              <Input {...editForm.register("editTitle")} />
              <Textarea {...editForm.register("editDescription")} rows={3} />
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
              onClick={editForm.handleSubmit(onEditSubmit)}
              disabled={isPending}
              aria-label="Save todo"
            >
              <Save className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => onStartEditing(todo)}
              aria-label="Edit todo"
            >
              <Circle className="size-4" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={onDelete}
            disabled={isPending}
            aria-label="Delete todo"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}