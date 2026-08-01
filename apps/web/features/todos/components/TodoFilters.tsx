import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

export type FilterMode = "all" | "active" | "done";

const filterLabels: Record<FilterMode, string> = {
  all: "All",
  active: "Active",
  done: "Done",
};

interface TodoFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  filter: FilterMode;
  setFilter: (mode: FilterMode) => void;
}

export function TodoFilters({ search, setSearch, filter, setFilter }: TodoFiltersProps) {
  return (
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
  );
}