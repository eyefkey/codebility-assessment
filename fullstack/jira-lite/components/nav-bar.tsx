"use client";

import { signOut } from "next-auth/react";

export function NavBar({ userLabel }: { userLabel: string }) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
          J
        </span>
        jira-lite
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{userLabel}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
