import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/authorization";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { serializeTodo } from "@/lib/serialize-todo";
import { NavBar } from "@/components/nav-bar";
import { TodoBoard } from "@/components/todo-board";

export default async function TodosPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const todos = await prisma.todo.findMany({
    where:
      currentUser.role === "ADMIN"
        ? {}
        : {
            OR: [
              { userId: currentUser.id },
              ...(currentUser.groupId
                ? [{ user: { groupId: currentUser.groupId } }]
                : []),
            ],
          },
    include: { user: { select: { id: true, name: true, groupId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <NavBar
        userLabel={session.user.email ?? session.user.name ?? "Account"}
        isAdmin={isAdmin(currentUser)}
      />
      <TodoBoard initialTodos={todos.map((todo) => serializeTodo(todo, currentUser))} />
    </div>
  );
}
