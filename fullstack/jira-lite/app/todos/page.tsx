import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/nav-bar";
import { TodoBoard } from "@/components/todo-board";

export default async function TodosPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const todos = await prisma.todo.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <NavBar userLabel={session.user.email ?? session.user.name ?? "Account"} />
      <TodoBoard
        initialTodos={todos.map((todo) => ({
          ...todo,
          createdAt: todo.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
