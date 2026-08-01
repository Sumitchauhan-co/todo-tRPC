import { UseFormReturn } from "react-hook-form";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

interface CreateTodoInputs {
  title: string;
  description: string;
}

interface CreateTodoFormProps {
  form: UseFormReturn<CreateTodoInputs>;
  onSubmit: (data: CreateTodoInputs) => void;
  isPending: boolean;
}

export function CreateTodoForm({ form, onSubmit, isPending }: CreateTodoFormProps) {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="h-fit rounded-md border border-[#1f3427]/10 bg-white p-4 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-5 text-[#c46742]" />
        <h2 className="text-xl font-semibold">New task</h2>
      </div>
      <div className="grid gap-3">
        <Input {...form.register("title")} placeholder="Ship dashboard polish" maxLength={120} />
        <Textarea
          {...form.register("description")}
          placeholder="Capture the exact next action, owner, or acceptance note."
          rows={5}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add todo
        </Button>
      </div>
    </form>
  );
}