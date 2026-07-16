"use client";

import { useState } from "react";

type TodoStatus =
  | "TO_DO"
  | "IN_PROGRESS"
  | "READY_FOR_TESTING"
  | "TESTED_AND_VERIFIED"
  | "COMPLETED";

type Todo = {
  id: string;
  title: string;
  status: TodoStatus;
  createdAt: string;
  owner: { id: string; name: string };
  isOwner: boolean;
  permissions: {
    allowedStatuses: TodoStatus[];
    canEdit: boolean;
    canDelete: boolean;
  };
};

const STATUS_LABELS: Record<TodoStatus, string> = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  READY_FOR_TESTING: "Ready for Testing",
  TESTED_AND_VERIFIED: "Tested and Verified",
  COMPLETED: "Completed",
};

export function TodoBoard({
  columns,
  initialTodos,
}: {
  columns: TodoStatus[];
  initialTodos: Todo[];
}) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to create todo");
      }

      const data = await response.json();
      setTodos((prev) => [data.todo, ...prev]);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(todo: Todo, status: TodoStatus) {
    setPendingIds((prev) => new Set(prev).add(todo.id));
    setError(null);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to update todo");
      }

      const data = await response.json();
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? data.todo : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
    }
  }

  async function handleDelete(todo: Todo) {
    setPendingIds((prev) => new Set(prev).add(todo.id));
    setError(null);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete todo");

      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-6 px-6 py-8">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          maxLength={200}
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 user-invalid:border-red-500 user-invalid:text-red-600 user-invalid:focus:border-red-500 user-invalid:focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:user-invalid:border-red-500 dark:user-invalid:text-red-400"
        />
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
        {columns.map((status) => {
          const columnTodos = todos.filter((t) => t.status === status);
          return (
            <div
              key={status}
              className="flex min-w-56 flex-1 basis-0 flex-col gap-3 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900/50"
            >
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {STATUS_LABELS[status]}
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {columnTodos.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {columnTodos.length === 0 ? (
                  <EmptyState />
                ) : (
                  columnTodos.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      isPending={pendingIds.has(todo.id)}
                      onStatusChange={(status) => handleStatusChange(todo, status)}
                      onDelete={() => handleDelete(todo)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="rounded-md border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-600">
      Nothing here
    </p>
  );
}

function TodoCard({
  todo,
  isPending,
  onStatusChange,
  onDelete,
}: {
  todo: Todo;
  isPending: boolean;
  onStatusChange: (status: TodoStatus) => void;
  onDelete: () => void;
}) {
  const canChangeStatus = todo.permissions.allowedStatuses.length > 0;
  const selectableStatuses = canChangeStatus
    ? Array.from(new Set([todo.status, ...todo.permissions.allowedStatuses]))
    : [];

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-zinc-900 dark:text-zinc-50">{todo.title}</p>
        {todo.permissions.canDelete && (
          <button
            onClick={onDelete}
            disabled={isPending}
            aria-label="Delete todo"
            className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-950"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-600">
        {new Date(todo.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {todo.owner.name}
        </span>
      </div>

      {canChangeStatus ? (
        <select
          value={todo.status}
          disabled={isPending}
          onChange={(e) => onStatusChange(e.target.value as TodoStatus)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        >
          {selectableStatuses.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      ) : (
        <span className="w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {STATUS_LABELS[todo.status]}
        </span>
      )}
    </div>
  );
}
