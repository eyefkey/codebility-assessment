"use client";

import { useState } from "react";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  owner: { id: string; name: string };
  isOwner: boolean;
  permissions: {
    canToggle: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
};

export function TodoBoard({ initialTodos }: { initialTodos: Todo[] }) {
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

  async function handleToggle(todo: Todo) {
    setPendingIds((prev) => new Set(prev).add(todo.id));
    setError(null);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
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

  const myTodos = todos.filter((t) => t.isOwner);
  const teamTodos = todos.filter((t) => !t.isOwner);
  const todoItems = myTodos.filter((t) => !t.completed);
  const doneItems = myTodos.filter((t) => t.completed);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-6">
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

        <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
          <Column title="To Do" count={todoItems.length}>
            {todoItems.length === 0 ? (
              <EmptyState label="Nothing to do yet" />
            ) : (
              todoItems.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  isPending={pendingIds.has(todo.id)}
                  onToggle={() => handleToggle(todo)}
                  onDelete={() => handleDelete(todo)}
                />
              ))
            )}
          </Column>
          <Column title="Done" count={doneItems.length}>
            {doneItems.length === 0 ? (
              <EmptyState label="Nothing completed yet" />
            ) : (
              doneItems.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  isPending={pendingIds.has(todo.id)}
                  onToggle={() => handleToggle(todo)}
                  onDelete={() => handleDelete(todo)}
                />
              ))
            )}
          </Column>
        </div>
      </div>

      {teamTodos.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Team
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {teamTodos.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {teamTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                isPending={pendingIds.has(todo.id)}
                onToggle={() => handleToggle(todo)}
                onDelete={() => handleDelete(todo)}
                showOwner
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Column({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900/50">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-md border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-600">
      {label}
    </p>
  );
}

function TodoCard({
  todo,
  isPending,
  onToggle,
  onDelete,
  showOwner = false,
}: {
  todo: Todo;
  isPending: boolean;
  onToggle: () => void;
  onDelete: () => void;
  showOwner?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        disabled={isPending || !todo.permissions.canToggle}
        className="mt-1 h-4 w-4 shrink-0 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
      />
      <div className="flex-1">
        <p
          className={`text-sm text-zinc-900 dark:text-zinc-50 ${
            todo.completed ? "line-through text-zinc-400 dark:text-zinc-600" : ""
          }`}
        >
          {todo.title}
        </p>
        <p className="mt-1 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-600">
          {new Date(todo.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {showOwner && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {todo.owner.name}
            </span>
          )}
        </p>
      </div>
      {todo.permissions.canDelete && (
        <button
          onClick={onDelete}
          disabled={isPending}
          aria-label="Delete todo"
          className="rounded p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-950"
        >
          ✕
        </button>
      )}
    </div>
  );
}
